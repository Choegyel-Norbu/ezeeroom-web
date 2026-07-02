import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Pencil, Loader2, AlertTriangle, RotateCcw, ShieldCheck, Lock } from "lucide-react";
import api from "@/shared/services/Api";
import { useAuth } from "@/features/authentication";
import bobImg from "@/assets/images/bob.svg.png";
import bnbImg from "@/assets/images/bnb.png";
import bdbImg from "@/assets/images/bdb.png";
import dkImg from "@/assets/images/dk.jpeg";
import pnbImg from "@/assets/images/pnb.jpeg";
import tbankImg from "@/assets/images/tbank.jpg";

const PAYMENT_TIMEOUT_SECONDS = 180;

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

export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { getCurrentActiveRole } = useAuth();

  const {
    orderNumber, amount, bookingId, isExtension, hotelId,
    hotelName, roomType, checkIn, checkOut, nights, returnPath,
  } = state || {};

  const [seconds, setSeconds] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [step, setStep] = useState("init");
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNo, setAccountNo] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!orderNumber) navigate(-1);
  }, [orderNumber, navigate]);

  const cancelPendingBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      if (isExtension) {
        await api.delete(`/bookings/${bookingId}/extend`);
      } else {
        await api.delete(`/bookings/${bookingId}`);
      }
    } catch { /* ignore */ }
  }, [bookingId, isExtension]);

  const handleExit = useCallback(async (destination) => {
    await cancelPendingBooking();
    navigate(destination ?? returnPath ?? (hotelId ? `/hotel/${hotelId}` : "/hotels"));
  }, [cancelPendingBooking, navigate, hotelId, returnPath]);

  useEffect(() => {
    if (seconds <= 0) { handleExit(); return; }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, handleExit]);

  const formatTime = (total) => {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return { m, s };
  };
  const { m, s } = formatTime(seconds);

  const callNvp = useCallback(async (payload) => {
    try {
      const res = await api.post("/payments/rma/nvp", { orderNumber, ...payload });
      return res.data;
    } catch (err) {
      if (err.response?.data?.state) return err.response.data;
      throw err;
    }
  }, [orderNumber]);

  useEffect(() => {
    if (step === "failed") cancelPendingBooking();
  }, [step, cancelPendingBooking]);

  // Keep a ref so the popstate handler always sees the latest step
  // without needing to be re-registered on every step change.
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Cancel the pending booking when the user presses the browser back button.
  // We push a sentinel history entry on mount so the first "back" pops to it
  // (staying on this page) rather than immediately leaving. We then cancel
  // and navigate away programmatically.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = async () => {
      if (stepRef.current === "success") return; // payment done — let back work normally
      // Re-push to hold the page in place while we await the cancel API call
      window.history.pushState(null, "", window.location.href);
      await cancelPendingBooking();
      navigate(returnPath ?? (hotelId ? `/hotel/${hotelId}` : "/hotels"), { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount; values accessed via refs/stable callbacks

  useEffect(() => {
    if (!orderNumber) return;
    (async () => {
      try {
        const result = await callNvp({ messageType: "AR" });
        if (result.state === "SUCCESS") {
          setBanks(result.bankList || []);
          setStep("account");
        } else {
          setError(result.message || "Could not initiate payment.");
          setStep("failed");
        }
      } catch {
        setError("Payment gateway is currently unavailable. Please try again later.");
        setStep("failed");
      }
    })();
  }, [orderNumber, callNvp]);

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
      } else if (result.state === "RETRY_AUTH" || result.state === "FAILED") {
        setError(result.message || "Account verification failed. Please check your bank and account number.");
      } else {
        setError(result.message || "Payment failed.");
        setStep("failed");
      }
    } catch {
      setError("Payment gateway is currently unavailable.");
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
        setTimeout(() => {
          if (returnPath) {
            navigate(returnPath);
          } else {
            const role = getCurrentActiveRole();
            if (role === "GUEST") navigate("/guestDashboard");
            else if (["HOTEL_ADMIN", "STAFF", "MANAGER", "FRONTDESK"].includes(role)) navigate("/hotelAdmin");
            else navigate("/dashboard");
          }
        }, 2000);
      } else if (result.state === "RETRY_OTP") {
        setOtp("");
        setError(result.message || "Invalid OTP. Please try again.");
      } else if (result.state === "RETRY_AUTH") {
        setOtp("");
        setError("Wrong OTP. Your session has expired — tap \"Resend OTP\" to get a new code.");
      } else {
        setError(result.message || "Payment failed.");
        setStep("failed");
      }
    } catch {
      setError("Payment gateway is currently unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = amount != null ? `Nu ${parseFloat(amount).toFixed(2)}` : null;
  const maskedAccount = accountNo.length > 4
    ? "•".repeat(accountNo.length - 4) + accountNo.slice(-4)
    : accountNo;

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div className="min-h-dvh bg-neutral-100 flex flex-col md:items-center md:justify-center md:p-4">
      <div className="bg-white md:rounded-lg md:border md:border-neutral-200 md:shadow-sm overflow-hidden w-full md:max-w-4xl flex flex-col md:flex-row flex-1 md:flex-none">

        {/* ── Left Panel ── */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r md:border-neutral-200">

          {/* Mobile booking summary strip */}
          <div className="md:hidden bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 text-sm truncate">{hotelName || "Hotel Booking"}</p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {roomType} · {formatDate(checkIn)} → {formatDate(checkOut)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Total</p>
              <p className="text-sm font-bold text-neutral-900 font-mono">
                {amount != null ? `Nu ${parseFloat(amount).toFixed(2)}` : "—"}
              </p>
            </div>
            <button
              onClick={() => handleExit()}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded border border-neutral-200 hover:border-neutral-300 text-neutral-400 hover:text-neutral-700 transition-all"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form area */}
          <div className="flex-1 p-5 md:px-10 md:py-9 flex flex-col gap-6">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.1em]">Payment</span>
              <div className="flex items-center gap-[2px]">
                {[m[0], m[1], ":", s[0], s[1]].map((char, i) =>
                  char === ":" ? (
                    <span key={i} className="text-neutral-400 font-mono font-bold text-sm px-0.5">:</span>
                  ) : (
                    <span key={i} className="w-6 h-7 bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono font-bold text-xs flex items-center justify-center rounded-[3px]">
                      {char}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Step breadcrumb */}
            <div className="flex items-center gap-1.5 pb-5 border-b border-neutral-200">
              <span className={`text-[11px] ${step === "account" || step === "init" ? "text-neutral-900" : "text-neutral-400 line-through decoration-neutral-300"}`}>
                Select bank
              </span>
              <span className="text-neutral-300 text-[10px]">›</span>
              <span className={`text-[11px] ${step === "otp" ? "text-neutral-900" : step === "success" ? "text-neutral-400 line-through decoration-neutral-300" : "text-neutral-400"}`}>
                Verify OTP
              </span>
              <span className="text-neutral-300 text-[10px]">›</span>
              <span className={`text-[11px] ${step === "success" ? "text-neutral-900" : "text-neutral-400"}`}>
                Done
              </span>
            </div>

            {/* ── INIT ── */}
            {step === "init" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <div className="w-5 h-5 border-[1.5px] border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
                <p className="text-xs text-neutral-400">Connecting to payment gateway…</p>
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {step === "account" && (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-neutral-900">Select Your Bank</p>
                  <p className="text-sm text-neutral-500">Choose your bank for mobile payment</p>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {banks.map((bank) => {
                      const img = getBankImage(bank.name);
                      const selected = bankId === bank.id;
                      return (
                        <button
                          key={bank.id}
                          onClick={() => { setBankId(bank.id); setSelectedBank(bank); setError(""); }}
                          className={`relative flex flex-col items-center justify-center gap-2 rounded-[4px] cursor-pointer p-3 border transition-all duration-150 ${
                            selected
                              ? "bg-neutral-50 border-neutral-900"
                              : "bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          {img ? (
                            <img src={img} alt={bank.name} className="w-full h-10 object-contain" />
                          ) : (
                            <span className="text-sm font-mono font-bold text-neutral-800">
                              {bank.name.slice(0, 3).toUpperCase()}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-600 font-medium text-center uppercase tracking-wide leading-tight line-clamp-1 w-full">
                            {bank.name}
                          </span>
                          {selected && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-neutral-900 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1.5 5l2.5 2.5 4.5-4" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-neutral-900">Account Number</p>
                  <p className="text-sm text-neutral-500">Enter your bank account number</p>
                  <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-[4px] px-3 py-2.5 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100 transition-all">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Enter your account number"
                      value={accountNo}
                      onChange={(e) => { setAccountNo(e.target.value); setError(""); }}
                      className="flex-1 text-sm text-neutral-900 font-mono tracking-wide outline-none bg-transparent min-w-0 placeholder:text-neutral-300 placeholder:font-sans placeholder:text-xs placeholder:tracking-normal"
                    />
                    <svg className="w-3.5 h-3.5 text-neutral-300 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-[4px] border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-xs text-red-600">{error}</span>
                  </div>
                )}

                <button
                  onClick={() => handleAccountSubmit(false)}
                  disabled={isSubmitting || !bankId || !accountNo.trim()}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-[4px] transition-all duration-150 mt-auto flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Continue
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6h8M6 2l4 4-4 4" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}

            {/* ── OTP ── */}
            {step === "otp" && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-neutral-900">Bank</p>
                    <button
                      onClick={() => setStep("account")}
                      className="flex items-center gap-1.5 text-neutral-500 text-xs border border-neutral-200 rounded-[3px] px-2.5 py-1 hover:border-neutral-300 hover:text-neutral-800 transition-all"
                    >
                      <Pencil className="w-2.5 h-2.5" /> Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3 border border-neutral-200 rounded-[4px] px-3 py-2.5 bg-neutral-50">
                    {getBankImage(selectedBank?.name) ? (
                      <img src={getBankImage(selectedBank?.name)} alt={selectedBank?.name} className="w-10 h-7 object-contain shrink-0" />
                    ) : (
                      <span className="text-xs font-mono font-bold text-neutral-800 w-10 shrink-0">
                        {selectedBank?.name?.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                    <span className="flex-1 text-xs text-neutral-600 font-mono truncate">{selectedBank?.name}</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                      <svg className="w-2 h-2" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5l2.5 2.5 4.5-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-neutral-900">Account Number</p>
                  <p className="text-sm text-neutral-500">OTP sent to your registered phone number</p>
                  <div className="flex items-center border border-neutral-200 rounded-[4px] px-3 py-2.5 bg-neutral-50">
                    <span className="flex-1 text-neutral-500 tracking-wider text-sm font-mono">{maskedAccount}</span>
                    <svg className="w-3.5 h-3.5 text-neutral-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-neutral-900">One-Time Password</p>
                  <p className="text-sm text-neutral-500">Enter the OTP sent to your phone</p>
                  <div className="flex items-center border border-neutral-300 rounded-[4px] px-3 py-3 bg-neutral-50 focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-neutral-100 transition-all">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      placeholder="— — — — — —"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value); setError(""); }}
                      className="flex-1 text-neutral-900 font-mono tracking-[0.45em] text-center text-xl outline-none bg-transparent placeholder:text-neutral-300 placeholder:tracking-[0.2em] placeholder:text-base"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={async () => { setIsResending(true); await handleAccountSubmit(true); setIsResending(false); }}
                    disabled={isSubmitting}
                    className="mt-0.5 text-neutral-400 text-xs hover:text-neutral-700 transition-colors disabled:text-neutral-300 self-start flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    {isResending ? "Sending OTP…" : "Resend OTP"}
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-[4px] border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-xs text-red-600">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleOtpSubmit}
                  disabled={isSubmitting || !otp.trim()}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-[4px] transition-all duration-150 mt-auto flex items-center justify-center gap-2"
                >
                  {isSubmitting && !isResending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      {formattedAmount ? `Pay ${formattedAmount}` : "Pay Now"}
                    </>
                  )}
                </button>
              </>
            )}

            {/* ── SUCCESS ── */}
            {step === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
                <div className="w-11 h-11 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-900">Payment complete</p>
                <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                  {formattedAmount ? `${formattedAmount} debited successfully.` : "Payment processed."} Your booking is confirmed.
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Redirecting…
                </div>
              </div>
            )}

            {/* ── FAILED ── */}
            {step === "failed" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
                <div className="w-11 h-11 rounded-full border border-red-100 bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Payment failed</p>
                <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                  {error || "Your payment could not be processed."}
                </p>
                <button
                  onClick={() => handleExit()}
                  className="border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 font-medium text-sm py-2 px-6 rounded-[4px] transition-all duration-150 mt-2"
                >
                  Go back
                </button>
              </div>
            )}

            {/* Security note — only on form steps */}
            {(step === "account" || step === "otp") && (
              <div className="flex items-center gap-1.5 pt-4 border-t border-neutral-100 mt-auto">
                <ShieldCheck className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                <span className="text-[10px] text-neutral-300 tracking-wide">Secured by RMA BFS · End-to-end encrypted</span>
              </div>
            )}

          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="hidden md:flex md:w-72 bg-neutral-50 flex-col relative border-l border-neutral-200">
          <button
            onClick={() => handleExit()}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-[3px] border border-neutral-200 hover:border-neutral-300 text-neutral-400 hover:text-neutral-700 transition-all z-10"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Booking card */}
          <div className="px-5 pt-8 pb-4">
            <div className="border border-neutral-200 rounded-[4px] overflow-hidden bg-white">
              <div className="bg-white px-4 pt-5 pb-4 border-b border-neutral-100">
                {step === "success" && (
                  <span className="text-[10px] font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-[3px] uppercase tracking-wider font-mono">
                    Paid ✓
                  </span>
                )}
                <p className="text-neutral-900 font-semibold text-sm mt-3 leading-snug">{hotelName || "Hotel Booking"}</p>
                <span className="inline-block mt-2 text-[9px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-[3px] uppercase tracking-[0.1em] font-mono">
                  {roomType || "Room"}
                </span>
              </div>
              <div className="bg-neutral-50 px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Check-in</p>
                  <p className="text-xs font-medium text-neutral-900 font-mono">{formatDate(checkIn)}</p>
                </div>
                <span className="text-neutral-300 text-xs shrink-0 mt-3">→</span>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-xs font-medium text-neutral-900 font-mono">{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <div className="px-5 py-3 flex flex-col gap-2.5 flex-1">
            {[
              { k: "Hotel", v: hotelName },
              { k: "Order", v: orderNumber },
              { k: "Room type", v: roomType },
              nights != null ? { k: "Nights", v: `${nights}` } : null,
              { k: "Check-in", v: formatDate(checkIn) },
              { k: "Check-out", v: formatDate(checkOut) },
            ].filter(Boolean).map(({ k, v }) => (
              <div key={k} className="flex justify-between items-start gap-2">
                <span className="text-[11px] text-neutral-400 shrink-0">{k}</span>
                <span className="text-[11px] text-neutral-600 font-mono text-right break-all max-w-[55%]">{v || "—"}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-5 mb-5 pt-4 border-t border-neutral-200">
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.08em] mb-1.5">Total due</p>
            <p className="font-mono font-bold text-neutral-900 tabular-nums tracking-tight leading-none">
              {amount != null ? (
                <>
                  <span className="text-sm font-normal text-neutral-400 mr-1">Nu</span>
                  <span className="text-3xl">{String(parseFloat(amount).toFixed(2)).split(".")[0]}</span>
                  <span className="text-sm font-normal text-neutral-400">
                    .{String(parseFloat(amount).toFixed(2)).split(".")[1]}
                  </span>
                </>
              ) : (
                <span className="text-xl text-neutral-300">—</span>
              )}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
