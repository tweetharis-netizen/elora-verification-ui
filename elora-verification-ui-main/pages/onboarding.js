// pages/onboarding.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    try {
      const role = localStorage.getItem("elora_role");
      const isGuest = localStorage.getItem("elora_guest");
      const verified = localStorage.getItem("elora_verified");

      // If no role was selected, send back to homepage
      if (!role && !isGuest) {
        router.replace("/");
        return;
      }

      // Guest users skip verification
      if (isGuest === "true") {
        router.replace("/assistant");
        return;
      }

      // If not verified → go verify
      if (verified !== "true") {
        router.replace("/verify");
        return;
      }

      // Verified + has role → Assistant
      router.replace("/assistant");
    } catch (e) {
      console.error(e);
      router.replace("/");
    }
  }, []);

  return null;
}
