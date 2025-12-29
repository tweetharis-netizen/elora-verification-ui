// pages/verify.js
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth, firebaseConfigOk, firebaseConfigMissingKeys } from "@/lib/firebase";
import {
  getSession,
  saveSession,
  setGuest,
  setPendingInvite,
  getPendingInvite,
  clearPendingInvite,
  activateTeacher,
  setPendingVerifyEmail,
  getPendingVerifyEmail,
  clearPendingVerifyEmail,
} from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function prettyFirebaseError(err) {
  const code = err?.code || "";
  if (code.includes("auth/invalid-email")) return "That email address looks invalid.";
  if (code.includes("auth/operation-not-allowed"))
    return "Email link sign-in is not enabled in Firebase Auth. Enable it under Authentication → Sign-in method.";
  if (code.includes("auth/argument-error"))
    return "Firebase is misconfigured (check your env vars + redeploy).";
  if (code.includes("auth/unauthorized-continue-uri"))
    return "Firebase blocked this site URL. Add your current Vercel domain to Firebase Authorized domains.";
  if (code.includes("auth/too-many-requests"))
    return "Too many requests. Please wait a minute and try again.";
  if (code.includes("auth/invalid-action-code"))
    return "That verification link is invalid or expired. Request a new one.";
  if (code.includes("auth/expired-action-code"))
    return "That verification link expired. Request a new one.";
  if (code.includes("auth/user-disabled")) return "This account is disabled.";
  return "Could not complete verification. Please try again.";
}

export default function Verify() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ kind: "idle", msg: "" }); // idle | info | ok | err | loading
  const [needsEmailForLink, setNeedsEmailForLink] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Debug state (so it can’t “do nothing”)
  const [debug, setDebug] = useState({
    origin: "",
    continueUrl: "",
    lastActionAt: "",
    lastErrorCode: "",
    lastErrorMessage: "",
    firebaseConfigOk: firebaseConfigOk,
    firebaseMissing: firebaseConfigMissingKeys.join(", "),
  });

  const cooldownRef = useRef(null);
  const pendingInvite = useMemo(() => getPendingInvite(), [router.isReady]);

  // hydrate email field
  useEffect(() => {
    const stored = getPendingVerifyEmail() || getSession().email || "";
    if (stored && !email) setEmail(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // track origin for debugging
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDebug((d) => ({ ...d, origin: window.location.origin }));
  }, []);

  // capture invite links like /verify?invite=CODE or /verify?code=CODE
  useEffect(() => {
    if (!router.isReady) return;
    const invite = (router.query.invite || router.query.code || "").toString().trim();
    if (invite) setPendingInvite(invite);
  }, [router.isReady, router.query.invite, router.query.code]);

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((n) => Math.max(0, n - 1));
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  // If user landed via Firebase email link, complete verification
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof window === "undefined") return;

    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return;

    const stored = getPendingVerifyEmail() || getSession().email || "";
    if (!stored) {
      setNeedsEmailForLink(true);
      setStatus({ kind: "info", msg: "Enter your email to finish verification." });
      return;
    }

    (async () => {
      try {
        setStatus({ kind: "loading", msg: "Finishing verification…" });

        const result = await signInWithEmailLink(auth, stored, href);

        const s = getSession();
        s.email = result?.user?.email || stored;
        s.verified = true;
        s.guest = false;
        s.verifiedAt = new Date().toISOString();
        saveSession(s);

        clearPendingVerifyEmail();

        const code = getPendingInvite();
        if (code) {
          try {
            const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
            if (res.ok) activateTeacher(code);
          } catch {
            // ignore
          } finally {
            clearPendingInvite();
          }
        }

        setStatus({ kind: "ok", msg: "Verified ✅ You can now export DOCX / PDF / PPTX." });
        router.replace("/verify", undefined, { shallow: true });
      } catch (e) {
        setDebug((d) => ({
          ...d,
          lastErrorCode: e?.code || "",
          lastErrorMessage: e?.message || String(e),
        }));
        setStatus({ kind: "err", msg: prettyFirebaseError(e) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const sendEmail = async () => {
    // If the click fires, you will see this instantly.
    setStatus({ kind: "info", msg: "Clicked. Preparing to send…" });
    setDebug((d) => ({
      ...d,
      lastActionAt: new Date().toISOString(),
      lastErrorCode: "",
      lastErrorMessage: "",
    }));

    const e = (email || "").trim();
    if (!e || !e.includes("@")) {
      setStatus({ kind: "err", msg: "Please enter a valid email address." });
      return;
    }

    if (!firebaseConfigOk) {
      setStatus({
        kind: "err",
        msg: `Firebase env vars missing: ${firebaseConfigMissingKeys.join(", ")}`,
      });
      return;
    }

    if (typeof window === "undefined") return;

    const invite = getPendingInvite();
    const origin = window.location.origin;
    const continueUrl = invite
      ? `${origin}/verify?invite=${encodeURIComponent(invite)}`
      : `${origin}/verify`;

    setDebug((d) => ({ ...d, origin, continueUrl }));

    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    try {
      setStatus({ kind: "loading", msg: "Sending verification email…" });

      // store pending email before request
      setPendingVerifyEmail(e);

      await sendSignInLinkToEmail(auth, e, actionCodeSettings);

      setStatus({ kind: "ok", msg: `Email sent ✅ Check your inbox: ${e}` });
      setCooldown(20);
    } catch (err) {
      setDebug((d) => ({
        ...d,
        lastErrorCode: err?.code || "",
        lastErrorMessage: err?.message || String(err),
      }));
      setStatus({ kind: "err", msg: prettyFirebaseError(err) });
    }
  };

  const finishWithEmail = async () => {
    setStatus({ kind: "info", msg: "Clicked. Finishing verification…" });

    const e = (email || "").trim();
    if (!e || !e.includes("@")) {
      setStatus({ kind: "err", msg: "Enter the same email you used to request the link." });
      return;
    }
    if (typeof window === "undefined") return;

    try {
      setStatus({ kind: "loading", msg: "Finishing verification…" });
      const result = await signInWithEmailLink(auth, e, window.location.href);

      const s = getSession();
      s.email = result?.user?.email || e;
      s.verified = true;
      s.guest = false;
      s.verifiedAt = new Date().toISOString();
      saveSession(s);

      clearPendingVerifyEmail();
      setNeedsEmailForLink(false);

      const code = getPendingInvite();
      if (code) {
        try {
          const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
          if (res.ok) activateTeacher(code);
        } catch {
          // ignore
        } finally {
          clearPendingInvite();
        }
      }

      setStatus({ kind: "ok", msg: "Verified ✅ You can now export DOCX / PDF / PPTX." });
      router.replace("/verify", undefined, { shallow: true });
    } catch (err) {
      setDebug((d) => ({
        ...d,
        lastErrorCode: err?.code || "",
        lastErrorMessage: err?.message || String(err),
      }));
      setStatus({ kind: "err", msg: prettyFirebaseError(err) });
    }
  };

  const openGmail = () => {
    if (typeof window === "undefined") return;
    window.open("https://mail.google.com/", "_blank", "noopener,noreferrer");
  };

  const onEmailKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!needsEmailForLink) sendEmail();
      else finishWithEmail();
    }
  };

  return (
    <>
      <Head>
        <title>Elora — Verify</title>
      </Head>

      <div className="mt-16 sm:mt-20 mx-auto max-w-xl px-2 sm:px-0">
        <div className="rounded-3xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
            Verify your email
          </h1>

          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Verification unlocks exports (DOCX / PDF / PPTX). You’ll receive an email with a secure sign-in link.
            <span className="font-semibold"> Verified only happens after you click that link.</span>
          </p>

          {pendingInvite ? (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
              <div className="text-sm font-extrabold text-amber-800 dark:text-amber-200">
                Teacher invite detected
              </div>
              <div className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/90">
                After verification, Elora will attempt to unlock Educator access using this invite.
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <label className="text-sm font-extrabold text-slate-950 dark:text-white">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onEmailKeyDown}
              placeholder="you@school.edu"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-950/35 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="mt-5 grid gap-2">
            {!needsEmailForLink ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  sendEmail();
                }}
                disabled={status.kind === "loading" || cooldown > 0}
                className={cn(
                  "w-full px-5 py-3 rounded-2xl text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 transition",
                  status.kind === "loading"
                    ? "bg-indigo-400 cursor-wait"
                    : cooldown > 0
                    ? "bg-indigo-500/60 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                {cooldown > 0 ? `Resend available in ${cooldown}s` : "Send verification email"}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  finishWithEmail();
                }}
                className={cn(
                  "w-full px-5 py-3 rounded-2xl text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
                  status.kind === "loading"
                    ? "bg-indigo-400 cursor-wait"
                    : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                Finish verification
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                openGmail();
              }}
              className="w-full px-5 py-3 rounded-2xl text-sm font-bold border border-white/10 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/85 dark:hover:bg-slate-950/55"
            >
              Open Gmail
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setGuest(true);
                router.push("/assistant");
              }}
              className="w-full px-5 py-3 rounded-2xl text-sm font-bold border border-white/10 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/85 dark:hover:bg-slate-950/55"
            >
              Try as Guest (limited)
            </button>
          </div>

          {status.kind !== "idle" ? (
            <div
              className={cn(
                "mt-4 text-sm font-bold",
                status.kind === "ok"
                  ? "text-emerald-700 dark:text-emerald-200"
                  : status.kind === "loading" || status.kind === "info"
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-rose-700 dark:text-rose-200"
              )}
            >
              {status.msg}
            </div>
          ) : null}

          {/* Debug panel (temporary, but extremely useful). You can remove later. */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/45 dark:bg-slate-950/30 backdrop-blur-xl p-4">
            <div className="text-xs font-extrabold text-slate-950 dark:text-white">Debug</div>
            <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div>
                <span className="font-semibold">Firebase config ok:</span>{" "}
                {String(firebaseConfigOk)}
              </div>
              {!firebaseConfigOk ? (
                <div>
                  <span className="font-semibold">Missing env:</span>{" "}
                  {firebaseConfigMissingKeys.join(", ")}
                </div>
              ) : null}
              <div>
                <span className="font-semibold">Origin:</span> {debug.origin || "(loading)"}
              </div>
              <div className="break-all">
                <span className="font-semibold">Continue URL:</span>{" "}
                {debug.continueUrl || "(click send to compute)"}
              </div>
              <div>
                <span className="font-semibold">Last action:</span>{" "}
                {debug.lastActionAt || "(none yet)"}
              </div>
              {debug.lastErrorCode || debug.lastErrorMessage ? (
                <div className="mt-2">
                  <div className="font-semibold">Last error:</div>
                  <div className="break-all">{debug.lastErrorCode}</div>
                  <div className="break-all">{debug.lastErrorMessage}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:opacity-90"
            >
              ← Back home
            </Link>
            <Link
              href="/assistant"
              className="text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20"
            >
              Continue →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
