import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Grid3X3,
  Pencil,
} from "lucide-react";
import api from "../services/Api";
import bobImg from "@/assets/images/bob.svg.png";
import bnbImg from "@/assets/images/bnb.png";
import bdbImg from "@/assets/images/bdb.png";
import dkImg from "@/assets/images/dk.jpeg";
import pnbImg from "@/assets/images/pnb.jpeg";
import tbankImg from "@/assets/images/tbank.jpg";

const getBankImage = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("bank of bhutan")) return bobImg;
  if (n.includes("national bank")) return bnbImg;
  if (n.includes("development bank")) return bdbImg;
  if (n.includes("t bank") || n.includes("tbank")) return tbankImg;
  if (n.includes("druk") || n.includes("pnbl") || n.includes("pnb")) return pnbImg;
  if (n.includes("dk") || n.includes("d.k")) return dkImg;
  return null;
};

/**
 * RMA NVP in-app payment dialog (3-step BFS flow).
 *
 * Props:
 * - open: boolean
 * - orderNumber: payment transaction order number
 * - amount: amount to display (optional)
 * - description: payment label shown in the header (optional)
 * - onSuccess(result): called once the debit completes
 * - onFailure(message): called on terminal failure
 * - onClose(): called when the user dismisses the dialog
 */
const RMAPaymentDialog = ({
  open,
  orderNumber,
  amount,
  description = "Payment",
  onSuccess,
  onFailure,
  onClose,
}) => {
  const [step, setStep] = useState("init"); // init | account | otp | success | failed
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNo, setAccountNo] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const callNvp = useCallback(
    async (payload) => {
      try {
        const res = await api.post("/payments/rma/nvp", { orderNumber, ...payload });
        return res.data;
      } catch (err) {
        if (err.response?.data?.state) return err.response.data;
        throw err;
      }
    },
    [orderNumber]
  );

  // AR on open
  useEffect(() => {
    if (!open || !orderNumber) return;
    let cancelled = false;
    setStep("init");
    setError("");
    setBanks([]);
    setBankId("");
    setSelectedBank(null);
    setAccountNo("");
    setOtp("");

    (async () => {
      try {
        const result = await callNvp({ messageType: "AR" });
        if (cancelled) return;
        if (result.state === "SUCCESS") {
          setBanks(result.bankList || []);
          setStep("account");
        } else {
          setError(result.message || "Could not initiate payment.");
          setStep("failed");
          if (onFailure) onFailure(result.message);
        }
      } catch {
        if (cancelled) return;
        setError("Payment gateway is currently unavailable. Please try again later.");
        setStep("failed");
        if (onFailure) onFailure("Payment gateway unavailable");
      }
    })();

    return () => { cancelled = true; };
  }, [open, orderNumber, callNvp, onFailure]);

  const handleAccountSubmit = async (resend = false) => {
    if (!bankId || !accountNo.trim()) {
      setError("Please select your bank and enter your account number.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await callNvp({ messageType: "AE", bankId, accountNo: accountNo.trim() });
      if (result.state === "SUCCESS") {
        setOtp("");
        setStep("otp");
        if (resend) setError("");
      } else if (result.state === "RETRY_AUTH") {
        setError(result.message || "Account verification failed. Please check your details.");
      } else {
        setError(result.message || "Payment failed.");
        setStep("failed");
        if (onFailure) onFailure(result.message);
      }
    } catch {
      setError("Payment gateway is currently unavailable. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your phone.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await callNvp({ messageType: "DR", otp: otp.trim() });
      if (result.state === "SUCCESS") {
        setStep("success");
        if (onSuccess) onSuccess(result);
      } else if (result.state === "RETRY_OTP") {
        setOtp("");
        setError(result.message || "Invalid OTP. Please try again.");
      } else if (result.state === "RETRY_AUTH") {
        setOtp("");
        setError("Wrong OTP. Your session has expired — tap \"Resend OTP\" to get a new code.");
      } else {
        setError(result.message || "Payment failed.");
        setStep("failed");
        if (onFailure) onFailure(result.message);
      }
    } catch {
      setError("Payment gateway is currently unavailable. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogChange = (isOpen) => {
    if (!isOpen && !isSubmitting && onClose) onClose();
  };

  const formattedAmount = amount != null ? `Nu ${parseFloat(amount).toFixed(2)}` : null;

  const maskedAccount =
    accountNo.length > 4
      ? "•".repeat(accountNo.length - 4) + accountNo.slice(-4)
      : accountNo;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
            {description}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-0.5">
            {formattedAmount ? `Pay ${formattedAmount} securely via RMA BFS.` : "Pay securely via RMA BFS."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4 flex flex-col gap-4">

          {/* ── init ── */}
          {step === "init" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Connecting to payment gateway…</p>
            </div>
          )}

          {/* ── account ── */}
          {step === "account" && (
            <>
              <div>
                <p className="font-bold text-gray-900 text-sm">Select Your Bank</p>
                <p className="text-xs text-gray-500 mb-3">Choose your bank for mobile payment</p>
                <div className="grid grid-cols-3 gap-2">
                  {banks.map((bank) => {
                    const img = getBankImage(bank.name);
                    const selected = bankId === bank.id;
                    return (
                      <button
                        key={bank.id}
                        onClick={() => { setBankId(bank.id); setSelectedBank(bank); setError(""); }}
                        className={`relative flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer aspect-[3/2] p-1.5 ${
                          selected
                            ? "bg-blue-50 ring-2 ring-blue-600"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        {img ? (
                          <img src={img} alt={bank.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-gray-600">
                            {bank.name.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                        {selected && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 text-sm">Account Number</p>
                <p className="text-xs text-gray-500 mb-2">Enter your bank account number</p>
                <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                  accountNo ? "border-blue-500 ring-1 ring-blue-300" : "border-gray-200"
                }`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Enter your account number"
                    value={accountNo}
                    onChange={(e) => { setAccountNo(e.target.value); setError(""); }}
                    className="flex-1 text-sm text-gray-700 font-medium tracking-wide outline-none bg-transparent min-w-0"
                  />
                  <Grid3X3 className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handleAccountSubmit(false)}
                disabled={isSubmitting || !bankId || !accountNo.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-3 rounded-2xl transition-colors duration-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying account…
                  </span>
                ) : "Continue →"}
              </button>
            </>
          )}

          {/* ── otp ── */}
          {step === "otp" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Bank</p>
                    <p className="text-xs text-gray-500">Your selected bank</p>
                  </div>
                  <button
                    onClick={() => setStep("account")}
                    className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
                  {getBankImage(selectedBank?.name) ? (
                    <img src={getBankImage(selectedBank?.name)} alt={selectedBank?.name} className="w-10 h-7 object-contain shrink-0" />
                  ) : (
                    <span className="text-sm font-bold text-gray-600 w-10 shrink-0">
                      {selectedBank?.name?.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 text-sm text-gray-700 font-medium truncate">{selectedBank?.name}</span>
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 text-sm">Account Number</p>
                <p className="text-xs text-gray-500 mb-2">OTP sent to your registered phone number</p>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3">
                  <span className="flex-1 text-gray-400 tracking-wider text-sm font-mono">{maskedAccount}</span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 text-sm">One-Time Password</p>
                <p className="text-xs text-gray-500 mb-2">Enter the OTP sent to your phone</p>
                <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                  otp ? "border-blue-500 ring-1 ring-blue-300" : "border-gray-200"
                }`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(""); }}
                    className="flex-1 text-blue-600 font-semibold tracking-[0.4em] text-center text-xl outline-none bg-transparent"
                    autoFocus
                  />
                </div>
                <button
                  onClick={async () => { setIsResending(true); await handleAccountSubmit(true); setIsResending(false); }}
                  disabled={isSubmitting}
                  className="mt-2 text-blue-600 text-xs hover:underline disabled:text-gray-400"
                >
                  {isResending ? "Sending OTP…" : "Resend OTP"}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleOtpSubmit}
                disabled={isSubmitting || !otp.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-3 rounded-2xl transition-colors duration-200"
              >
                {isSubmitting && !isResending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing payment…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    {formattedAmount ? `Pay ${formattedAmount}` : "Pay Now"}
                  </span>
                )}
              </button>
            </>
          )}

          {/* ── success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">Payment Successful!</p>
              <p className="text-center text-sm text-gray-500">Your payment has been completed successfully.</p>
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-2xl transition-colors duration-200 mt-2"
              >
                Done
              </button>
            </div>
          )}

          {/* ── failed ── */}
          {step === "failed" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">Payment Failed</p>
              <p className="text-center text-sm text-gray-500">
                {error || "Your payment could not be processed."}
              </p>
              <button
                onClick={onClose}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-3 rounded-2xl transition-colors duration-200 mt-2"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RMAPaymentDialog;
