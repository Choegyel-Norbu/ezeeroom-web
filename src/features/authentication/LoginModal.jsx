import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import useOutsideClick from "../../shared/hooks/useOutsideClick";
import GoogleSignInButton from "./GoogleSignInButton";
import { useAuth } from "./AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Alert,
  AlertDescription,
} from "@/shared/components";
import { X } from "lucide-react";
import logoER from "@/assets/images/logoER.png";

const LoginModal = ({ onClose, flag }) => {
  const modalRef = useRef(null);
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useOutsideClick(modalRef, isLoggingIn ? () => {} : onClose);

  const handleLoginStart = () => {
    setIsLoggingIn(true);
    setError("");
    setMessage("");
  };

  const handleLoginComplete = () => {
    setIsLoggingIn(false);
  };

  const handleLoginSuccess = async (authData) => {
    try {
      await login(authData);
      setMessage("Login successful!");
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  const handleLoginError = (msg) => {
    setError(msg);
  };

  return (
    <Dialog open={true} onOpenChange={isLoggingIn ? () => {} : onClose}>
      <DialogContent
        ref={modalRef}
        showCloseButton={false}
        className="w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-md"
      >
        <Button
          onClick={onClose}
          disabled={isLoggingIn}
          variant="ghost"
          size="icon"
          aria-label="Close sign in dialog"
          className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Brand header */}
        <div className="flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent px-8 pb-6 pt-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-black/5">
            <img src={logoER} alt="EzeeRoom" className="h-9 w-auto" />
          </div>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-center text-xl font-semibold tracking-tight text-foreground">
              Welcome to EzeeRoom
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
              Sign in to continue to your account. New here? We&rsquo;ll set one
              up for you automatically.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 pb-7">
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 block border-emerald-200 text-center">
              <AlertDescription className="block w-full text-center text-sm text-emerald-600">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {!isAuthenticated && (
            <GoogleSignInButton
              onClose={onClose}
              onLoginSuccess={handleLoginSuccess}
              onLoginStart={handleLoginStart}
              onLoginComplete={handleLoginComplete}
              onLoginError={handleLoginError}
              flag={flag}
            />
          )}

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              to="/terms-and-conditions"
              className="font-medium text-primary hover:underline"
            >
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;