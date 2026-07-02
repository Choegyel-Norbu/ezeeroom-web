import { useEffect, useRef } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, GOOGLE_CLIENT_ID } from "../../shared/services/firebaseConfig";
import { exchangeFirebaseIdToken } from "./firebaseSessionExchange";
import { useAuth } from "./AuthProvider";

const GSI_SRC = "https://accounts.google.com/gsi/client";

// Load the Google Identity Services script exactly once across the app.
let gsiScriptPromise = null;
const loadGsiScript = () => {
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) resolve();
      else existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
};

/**
 * Global Google One Tap prompt.
 *
 * Mounted once at the app root (inside AuthProvider). When the user is signed
 * out and a VITE_GOOGLE_CLIENT_ID is configured, it auto-displays the One Tap
 * prompt. The returned Google credential is converted to a Firebase credential
 * and run through the same /auth/firebase exchange as the popup flow, so the
 * backend and session handling stay identical.
 *
 * Renders nothing — One Tap injects its own UI.
 */
const GoogleOneTap = () => {
  const { login, isAuthenticated } = useAuth();
  const initializedRef = useRef(false);
  const signingInRef = useRef(false);

  useEffect(() => {
    // Dormant without a client ID, and never prompt an already-signed-in user.
    if (!GOOGLE_CLIENT_ID || isAuthenticated) return;

    let cancelled = false;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential || signingInRef.current) return;
      signingInRef.current = true;
      try {
        const credential = GoogleAuthProvider.credential(response.credential);
        const result = await signInWithCredential(auth, credential);
        const idToken = await result.user.getIdToken();
        const authData = await exchangeFirebaseIdToken(idToken);
        await login(authData);
      } catch (error) {
        // One Tap is a passive convenience prompt — fail quietly and let the
        // user fall back to the explicit "Continue with Google" button.
        if (import.meta.env.DEV) {
          console.error("Google One Tap sign-in failed:", error);
        }
      } finally {
        signingInRef.current = false;
      }
    };

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        if (!initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: true,
            context: "signin",
          });
          initializedRef.current = true;
        }

        window.google.accounts.id.prompt();
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Failed to load Google Identity Services:", error);
        }
      });

    return () => {
      cancelled = true;
      // Dismiss any open prompt when auth state changes or component unmounts.
      window.google?.accounts?.id?.cancel?.();
    };
  }, [isAuthenticated, login]);

  return null;
};

export default GoogleOneTap;
