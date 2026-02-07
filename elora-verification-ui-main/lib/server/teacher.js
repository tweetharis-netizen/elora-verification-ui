// lib/server/teacher.js
// Signed httpOnly cookie for "teacher tools" access.
//
// Security notes:
// - Cookie is signed with HMAC (SHA-256) using ELORA_TEACHER_COOKIE_SECRET (or SESSION_SECRET fallback).
// - Client cannot forge it without the secret.
// - We still require email verification BEFORE issuing this cookie.

import crypto from "crypto";

export const TEACHER_COOKIE_NAME = "elora_teacher";

function b64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function b64urlDecode(input) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = (input + pad).replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

function hmacSha256(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export function signTeacherCookiePayload(payload, secret, ttlSeconds = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const data = b64urlEncode(JSON.stringify(body));
  const sig = b64urlEncode(hmacSha256(data, secret));
  return `${data}.${sig}`;
}

export function verifyTeacherCookie(token, secret) {
  try {
    if (!token || !secret) return null;
    const [data, sig] = String(token).split(".");
    if (!data || !sig) return null;
    const expected = b64urlEncode(hmacSha256(data, secret));
    if (expected !== sig) return null;
    const payload = JSON.parse(b64urlDecode(data));
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export function isTeacherFromReq(req) {
  const secret = process.env.ELORA_TEACHER_COOKIE_SECRET || process.env.SESSION_SECRET;
  if (!secret) return false;
  const cookies = parseCookies(req);
  const token = cookies[TEACHER_COOKIE_NAME];
  const payload = verifyTeacherCookie(token, secret);
  return Boolean(payload?.teacher);
}

export function makeTeacherCookie(token, { maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${TEACHER_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearTeacherCookie() {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${TEACHER_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
