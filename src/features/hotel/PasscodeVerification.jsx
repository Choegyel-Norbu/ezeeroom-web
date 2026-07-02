import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Bed,
  Clock,
} from "lucide-react";
import api from "../../shared/services/Api";

const STATUS_STYLES = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  CHECKED_IN: "bg-blue-50 text-blue-700 border-blue-200",
  CHECKED_OUT: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const StatusChip = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status?.toUpperCase()] || "bg-neutral-50 text-neutral-600 border-neutral-200"}`}>
    {status}
  </span>
);

const StatCell = ({ label, value }) => (
  <div className="px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-0.5">{label}</p>
    <p className="text-[13px] font-medium text-neutral-950">{value || "—"}</p>
  </div>
);

const PasscodeVerification = ({ compact = false }) => {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const formatDateTime = (dateTimeString) => new Date(dateTimeString).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const checkIn = async () => {
    if (!bookingData?.bookingId) { setError("No booking data available"); return; }
    setCheckingIn(true);
    setError("");
    setCheckInMessage("");
    try {
      const response = await api.put(`/bookings/${bookingData.bookingId}/status/checked_in`);
      if (response.status === 200) {
        setBookingData((prev) => ({ ...prev, status: "CHECKED_IN" }));
        setCheckInMessage("Check-in successful! Guest has been checked in.");
        setTimeout(() => setCheckInMessage(""), 3000);
      } else {
        setError("Failed to check in");
      }
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else if (err.response?.status === 404) setError("Booking not found");
      else if (err.response?.status === 400) setError("Invalid status value");
      else if (err.response?.status === 403) setError("You are not authorized to perform this action");
      else if (err.response?.status === 409) setError("Cannot check in. The booking may be in an invalid state.");
      else setError("Network error. Please check your connection and try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const verifyPasscode = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) { setError("Please enter a passcode"); return; }
    setLoading(true);
    setError("");
    setBookingData(null);
    try {
      const response = await api.get(`/passcode/verify?passcode=${encodeURIComponent(passcode.trim())}`);
      const data = response.data;
      if (data.valid) { setBookingData(data); setPasscode(""); }
      else { setError(data.message || "Invalid passcode or booking not found"); }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPasscode("");
    setError("");
    setBookingData(null);
  };

  const inputContent = (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter passcode (e.g., A7B9K2)"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") verifyPasscode(e); }}
          className="flex-1 h-9 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] font-mono tracking-widest text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors disabled:opacity-60"
          maxLength={10}
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={verifyPasscode}
          disabled={loading || !passcode.trim()}
          className="h-9 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
              Verifying…
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Verify Passcode
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-neutral-400">6-character passcode</p>
    </div>
  );

  const BookingCard = () => (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-[12px] font-semibold text-neutral-950">
            Booking #{bookingData.bookingId}
          </span>
        </div>
        <StatusChip status={bookingData.status} />
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
        <StatCell label="Guest" value={bookingData.guestName} />
        <StatCell label="Hotel" value={bookingData.hotelName} />
        <StatCell label="Room" value={`Room ${bookingData.roomNumber}`} />
        <StatCell label="Check-in" value={bookingData.checkInDate ? formatDate(bookingData.checkInDate) : "—"} />
        <StatCell label="Check-out" value={bookingData.checkOutDate ? formatDate(bookingData.checkOutDate) : "—"} />
        <StatCell label="Booked" value={bookingData.createdAt ? formatDateTime(bookingData.createdAt) : "—"} />
      </div>
      <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={resetForm}
          disabled={checkingIn}
          className="h-8 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
        >
          Verify Another
        </button>
        <button
          type="button"
          onClick={checkIn}
          disabled={checkingIn || bookingData?.status === "CHECKED_IN"}
          className="h-8 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          {checkingIn ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
              Checking In…
            </>
          ) : bookingData?.status === "CHECKED_IN" ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Checked In
            </>
          ) : (
            "Check In"
          )}
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="w-full space-y-3">
        {!bookingData && inputContent}

        {error && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-l-red-500 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-neutral-950">{error}</p>
            </div>
            <button type="button" onClick={resetForm} className="text-[12px] font-medium text-neutral-500 hover:text-neutral-950 whitespace-nowrap flex-shrink-0 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {checkInMessage && (
          <div className="flex items-center gap-2 border-l-2 border-l-emerald-500 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-[13px] font-medium text-neutral-950">{checkInMessage}</p>
          </div>
        )}

        {bookingData && <BookingCard />}
      </div>
    );
  }

  return (
    <div className="h-auto w-full flex items-center justify-center sm:p-6">
      <div className="w-full max-w-2xl space-y-4">
        {!bookingData && (
          <div className="bg-white border border-neutral-200 rounded-lg p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">Passcode Verification</p>
            {inputContent}
          </div>
        )}

        {error && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-l-red-500 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-neutral-950">{error}</p>
            </div>
            <button type="button" onClick={resetForm} className="text-[12px] font-medium text-neutral-500 hover:text-neutral-950 whitespace-nowrap flex-shrink-0 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {checkInMessage && (
          <div className="flex items-center gap-2 border-l-2 border-l-emerald-500 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-[13px] font-medium text-neutral-950">{checkInMessage}</p>
          </div>
        )}

        {bookingData && <BookingCard />}
      </div>
    </div>
  );
};

export default PasscodeVerification;
