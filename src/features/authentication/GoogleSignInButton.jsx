import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../shared/services/firebaseConfig";
import { exchangeFirebaseIdToken } from "./firebaseSessionExchange";

// Map Firebase popup and backend (axios) errors to a user-friendly message.
// Returns null when the user simply cancelled the popup (nothing to show).
const getFriendlyAuthError = (error) => {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return null;
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    case "auth/unauthorized-domain":
      return "This site isn't authorized for Google sign-in. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      break;
  }

  // Errors coming back from the backend token exchange (/auth/firebase)
  if (error?.response) {
    return (
      error.response.data?.message ||
      "We couldn't complete your sign-in. Please try again in a moment."
    );
  }
  if (error?.request) {
    return "Couldn't reach the server. Please check your connection and try again.";
  }

  return "Sign-in failed. Please try again.";
};

const GoogleSignInButton = ({ onLoginSuccess, onClose, flag, onLoginStart, onLoginComplete, onLoginError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const processAuthentication = async (idToken, onLoginSuccess, onClose) => {
    const authData = await exchangeFirebaseIdToken(idToken);

    // Pass user data to AuthProvider (same for both flows)
    await onLoginSuccess(authData);

    // Close modal after successful login
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      onLoginStart?.();

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await processAuthentication(idToken, onLoginSuccess, onClose);
    } catch (error) {
      // Surface the failure instead of swallowing it as an unhandled rejection
      const friendly = getFriendlyAuthError(error);
      if (friendly) {
        onLoginError?.(friendly);
      }
    } finally {
      setIsLoading(false);
      onLoginComplete?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      aria-label="Continue with Google"
      aria-busy={isLoading}
      className="group relative flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-sm font-semibold text-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-sm disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
    >
      {/* subtle sheen on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/[0.02] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      {isLoading ? (
        <span className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none" />
          <span>Signing you in&hellip;</span>
        </span>
      ) : (
        <>
          {/* logo pinned left with a hairline divider; label stays centered */}
          <span className="absolute left-0 top-1/2 flex h-7 -translate-y-1/2 items-center border-r border-border pl-4 pr-3.5">
            <GoogleIcon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" />
          </span>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};

// Official Google "G" mark, inlined to avoid an external network request
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export default GoogleSignInButton;
