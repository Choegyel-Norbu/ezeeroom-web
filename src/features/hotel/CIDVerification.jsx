import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Bed,
  Clock,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../authentication";
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

const CIDVerification = ({ compact = false }) => {
  const { selectedHotelId, hotelId } = useAuth();
  const [cidNumber, setCidNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [error, setError] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const formatDateTime = (dateTimeString) => new Date(dateTimeString).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const validateCID = (cid) => {
    const trimmedCid = cid.trim();
    if (!/^\d{11}$/.test(trimmedCid)) return "CID must be exactly 11 digits";
    const dzongkhagCode = parseInt(trimmedCid.substring(0, 2), 10);
    if (dzongkhagCode < 1 || dzongkhagCode > 20) return "Invalid Dzongkhag code (must be 01–20)";
    if (/^0{11}$/.test(trimmedCid)) return "CID number cannot be all zeros";
    if (/^(\d)\1{10}$/.test(trimmedCid)) return "CID number cannot be all same digits";
    return null;
  };

  const checkIn = async (bookingId) => {
    if (!bookingId) { setError("No booking selected"); return; }
    setSelectedBookingId(bookingId);
    setCheckingIn(true);
    setError("");
    setCheckInMessage("");
    try {
      const response = await api.put(`/bookings/${bookingId}/status/checked_in`);
      if (response.status === 200) {
        setBookings((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, status: "CHECKED_IN" } : b));
        if (bookingData?.bookingId === bookingId) setBookingData((prev) => ({ ...prev, status: "CHECKED_IN" }));
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

  const verifyCID = async (e) => {
    e.preventDefault();
    if (!cidNumber.trim()) { setError("Please enter a CID number"); return; }
    const currentHotelId = selectedHotelId || hotelId;
    if (!currentHotelId) { setError("Hotel ID not available. Please refresh the page."); return; }
    const cidError = validateCID(cidNumber);
    if (cidError) { setError(cidError); return; }
    setLoading(true);
    setError("");
    setBookingData(null);
    setBookings([]);
    setSelectedBookingId(null);
    try {
      const response = await api.get(`/passcode/verify-by-cid?cid=${encodeURIComponent(cidNumber.trim())}&hotelId=${currentHotelId}`);
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        const validBookings = data.filter(b => b.isValid && b.valid);
        if (validBookings.length > 0) {
          setBookings(validBookings);
          if (validBookings.length === 1) { setBookingData(validBookings[0]); setSelectedBookingId(validBookings[0].bookingId); }
          else { setSelectedBookingId(validBookings[0].bookingId); }
          setCidNumber("");
        } else {
          setError("No valid bookings found for this CID number");
        }
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.valid) { setBookingData(data); setBookings([data]); setSelectedBookingId(data.bookingId); setCidNumber(""); }
        else { setError(data.message || "No booking found for this CID number"); }
      } else {
        setError("No booking found for this CID number");
      }
    } catch (err) {
      if (err.response?.status === 404) setError("No booking found for this CID number");
      else if (err.response?.status === 400) setError("Invalid CID number format");
      else setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCidNumber("");
    setError("");
    setBookingData(null);
    setBookings([]);
    setSelectedBookingId(null);
  };

  const handleCIDChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) setCidNumber(value);
  };

  const BookingCard = ({ booking }) => (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-[12px] font-semibold text-neutral-950">
            Booking #{booking.bookingId}
          </span>
        </div>
        <StatusChip status={booking.status} />
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
        <StatCell label="Guest" value={booking.guestName} />
        <StatCell label="Hotel" value={booking.hotelName} />
        <StatCell label="Room" value={`Room ${booking.roomNumber}`} />
        <StatCell label="Check-in" value={booking.checkInDate ? formatDate(booking.checkInDate) : "—"} />
        <StatCell label="Check-out" value={booking.checkOutDate ? formatDate(booking.checkOutDate) : "—"} />
        <StatCell label="Booked" value={booking.createdAt ? formatDateTime(booking.createdAt) : "—"} />
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
          onClick={() => checkIn(booking.bookingId)}
          disabled={checkingIn || booking.status === "CHECKED_IN"}
          className="h-8 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          {checkingIn && selectedBookingId === booking.bookingId ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
              Checking In…
            </>
          ) : booking.status === "CHECKED_IN" ? (
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

  const inputContent = (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter CID number (e.g., 10901001065)"
          value={cidNumber}
          onChange={handleCIDChange}
          onKeyDown={(e) => { if (e.key === "Enter") verifyCID(e); }}
          className="flex-1 h-9 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] font-mono tracking-wider text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors disabled:opacity-60"
          maxLength={11}
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={verifyCID}
          disabled={loading || !cidNumber.trim() || cidNumber.length !== 11}
          className="h-9 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
              Verifying…
            </>
          ) : (
            <>
              <CreditCard className="h-3.5 w-3.5" />
              Verify CID
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-neutral-400">11-digit Bhutanese CID number</p>
    </div>
  );

  if (compact) {
    return (
      <div className="w-full space-y-3">
        {bookings.length === 0 && !bookingData && inputContent}

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

        {(bookings.length > 0 || bookingData) && (
          <div className="space-y-3">
            {(bookings.length > 0 ? bookings : [bookingData]).map((booking, i) => (
              <BookingCard key={booking?.bookingId || i} booking={booking} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-auto w-full flex items-center justify-center sm:p-6">
      <div className="w-full max-w-2xl space-y-4">
        {bookings.length === 0 && !bookingData && (
          <div className="bg-white border border-neutral-200 rounded-lg p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">CID Verification</p>
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

        {(bookings.length > 0 || bookingData) && (
          <div className="space-y-3">
            {(bookings.length > 0 ? bookings : [bookingData]).map((booking, i) => (
              <BookingCard key={booking?.bookingId || i} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CIDVerification;
