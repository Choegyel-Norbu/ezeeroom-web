import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  X,
  Phone,
  ChevronLeft,
  ChevronRight,
  Hotel,
  CreditCard,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Navigation,
  ExternalLink,
  Home,
  CalendarPlus,
  RefreshCw,
  Bell,
  Star,
  MessageCircle,
  CalendarDays,
  TrendingUp,
  Download,
} from "lucide-react";
import { Separator } from "@/shared/components/separator";
import { Link, useNavigate } from "react-router-dom";
import api from "../../shared/services/Api";
import { useAuth } from "../authentication";
import { toast } from "sonner";
import { CustomDatePicker } from "../../shared/components";
import * as availability from "../booking/bookingAvailability";
import {
} from "@/shared/components";
import { API_BASE_URL } from "../../shared/services/firebaseConfig";
import HotelReviewSheet from "../hotel/HotelReviewSheet";
import { generateBookingReceipt } from "../../shared/utils/receiptGenerator";

// Number formatting function
// Round a currency amount to exactly 2 decimal places (nearest, HALF_UP) to match
// the backend's PriceCalculationService. Never rounds up to a whole Ngultrum.
const round2 = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const formatCurrency = (amount) => {
  return `Nu. ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /-`;
};

// Calculate extension days function
const calculateExtensionDays = (booking) => {
  if (!booking.extension || !booking.extendedAmount) {
    return 0;
  }
  
  // Calculate original nights
  const originalCheckIn = new Date(booking.checkInDate);
  const originalCheckOut = new Date(booking.checkOutDate);
  const originalNights = Math.ceil((originalCheckOut - originalCheckIn) / (1000 * 60 * 60 * 24));
  
  // Calculate original price per night
  const originalPricePerNight = (booking.txnTotalPrice || booking.totalPrice) / originalNights;
  
  // Calculate extension nights based on extended amount
  const extensionNights = Math.round(booking.extendedAmount / originalPricePerNight);
  
  return extensionNights;
};

// Status configuration
const statusConfig = {
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    dotColor: "bg-emerald-500",
    accentBorder: "border-l-emerald-400",
    icon: CheckCircle,
    actions: ["directions", "extend", "cancel"],
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
    dotColor: "bg-amber-500",
    accentBorder: "border-l-amber-400",
    icon: AlertCircle,
    actions: ["directions"],
  },
  CANCELLATION_REJECTED: {
    label: "Cancellation Rejected",
    color: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/80",
    dotColor: "bg-orange-500",
    accentBorder: "border-l-orange-400",
    icon: CheckCircle,
    actions: ["directions", "extend"],
  },
  BOOKING_CANCELLATION_APPROVED: {
    label: "Cancellation Approved",
    color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    dotColor: "bg-emerald-500",
    accentBorder: "border-l-emerald-400",
    icon: CheckCircle,
    actions: ["directions"],
  },
  PENDING: {
    label: "Pending",
    color: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200/80",
    dotColor: "bg-yellow-500",
    accentBorder: "border-l-yellow-400",
    icon: Clock,
    actions: ["directions"],
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-50 text-red-600 ring-1 ring-red-200/80",
    dotColor: "bg-red-500",
    accentBorder: "border-l-red-400",
    icon: XCircle,
    actions: ["directions"],
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
    dotColor: "bg-blue-500",
    accentBorder: "border-l-blue-400",
    icon: CheckCircle,
    actions: ["directions"],
  },
  CHECKED_IN: {
    label: "Checked In",
    color: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
    dotColor: "bg-violet-500",
    accentBorder: "border-l-violet-400",
    icon: CheckCircle,
    actions: ["directions", "extend", "review"],
  },
  CHECKED_OUT: {
    label: "Checked Out",
    color: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/80",
    dotColor: "bg-gray-400",
    accentBorder: "border-l-gray-300",
    icon: CheckCircle,
    actions: ["directions", "review"],
  },
};

// Loading skeleton component
const BookingCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-44"></div>
          <div className="h-3 bg-neutral-100 rounded w-28"></div>
          <div className="h-3 bg-neutral-100 rounded w-20"></div>
        </div>
        <div className="h-5 bg-neutral-100 rounded-full w-20"></div>
      </div>
      <div className="bg-neutral-50 rounded-md p-3 mb-4 border border-neutral-100">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 bg-neutral-200 rounded-md flex-shrink-0"></div>
              <div className="space-y-1.5">
                <div className="h-2 bg-neutral-200 rounded w-10"></div>
                <div className="h-3 bg-neutral-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-neutral-100">
        <div className="h-7 bg-neutral-100 rounded-md w-24"></div>
        <div className="h-7 bg-neutral-100 rounded-md w-20"></div>
        <div className="h-7 bg-neutral-100 rounded-md w-16"></div>
      </div>
    </div>
  </div>
);

// Extension visual feedback component
const ExtensionBadge = ({ booking }) => {
  const extensionDays = calculateExtensionDays(booking);

  if (!booking.extension || extensionDays <= 0) {
    return null;
  }

  return (
    <div className="border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-2.5 rounded-r-md mb-4 flex items-center gap-3">
      <CalendarDays className="text-emerald-600 flex-shrink-0" size={14} />
      <div className="flex-1">
        <span className="text-[13px] font-medium text-emerald-800">Stay Extended — </span>
        <span className="text-[13px] text-emerald-700">
          +{extensionDays} additional day{extensionDays !== 1 ? 's' : ''} added
        </span>
      </div>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING; // Fallback to PENDING if status not found

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

// Action button component
const ActionButton = ({ action, onClick, disabled = false }) => {
  const buttonConfig = {
    directions: { label: "Directions", icon: Navigation, variant: "outline" },
    cancel: { label: "Cancel", icon: X, variant: "outline" },
    contact: { label: "Contact", icon: Phone, variant: "outline" },
    extend: { label: "Extend", icon: CalendarPlus, variant: "outline" },
    review: { label: "Review", icon: Star, variant: "outline" },
    receipt: { label: "Download Receipt", icon: Download, variant: "outline" },
  };

  const config = buttonConfig[action];
  const IconComponent = config.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-medium border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <IconComponent size={12} />
      {config.label}
    </button>
  );
};

// Google Maps Modal Component
const GoogleMapsModal = ({ booking, isOpen, onClose }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(false);
        },
        (error) => {
          
          setLocationError(true);
        }
      );
    }
  }, [isOpen]);

  const openInGoogleMaps = () => {
    if (userLocation && booking) {
      // Open Google Maps with directions from user location to hotel
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${booking.hotelLatitude},${booking.hotelLongitude}`;
      window.open(url, "_blank");
    } else if (booking) {
      // Open Google Maps with just the hotel location
      const url = `https://www.google.com/maps/search/?api=1&query=${booking.hotelLatitude},${booking.hotelLongitude}`;
      window.open(url, "_blank");
    }
  };

  const openDirectionsWithAddress = () => {
    if (booking) {
      const encodedAddress = encodeURIComponent(booking.address);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(url, "_blank");
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-neutral-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-neutral-900">Get Directions</p>
            <p className="text-[12px] text-neutral-500">{booking.hotelName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <X size={14} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Hotel Address */}
          <div className="bg-neutral-50 rounded-md p-3 border border-neutral-100">
            <div className="flex items-start gap-3">
              <MapPin className="text-neutral-500 mt-0.5 flex-shrink-0" size={15} />
              <div>
                <p className="text-[13px] font-medium text-neutral-900">{booking.hotelName}</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">{booking.address}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                  {booking.hotelLatitude}, {booking.hotelLongitude}
                </p>
              </div>
            </div>
          </div>

          {/* Location Status */}
          {locationError && (
            <div className="border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2.5 rounded-r-md">
              <p className="text-[12px] text-amber-800">
                Location access denied. You can still open the hotel on the map.
              </p>
            </div>
          )}

          {userLocation && (
            <div className="border-l-4 border-l-emerald-500 bg-emerald-50 px-3 py-2.5 rounded-r-md">
              <p className="text-[12px] text-emerald-800">
                Your location detected — turn-by-turn directions available.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {userLocation && (
              <button
                onClick={openInGoogleMaps}
                className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 bg-neutral-950 text-white text-[13px] font-medium rounded-md hover:opacity-85 transition-opacity cursor-pointer"
              >
                <MapPin size={14} />
                Directions from My Location
                <ExternalLink size={13} />
              </button>
            )}

            <button
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${booking.hotelLatitude},${booking.hotelLongitude}`;
                window.open(url, "_blank");
              }}
              className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 border border-neutral-200 bg-white text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Hotel size={14} />
              View Hotel on Map
              <ExternalLink size={13} />
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 text-center pt-1">Opens in Google Maps</p>
        </div>
      </div>
    </div>
  );
};

// Extend Booking Modal Component
const ExtendBookingModal = ({ booking, isOpen, onClose, onExtend }) => {
  const navigate = useNavigate();
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [newCheckOutTime, setNewCheckOutTime] = useState("");
  const [extensionHours, setExtensionHours] = useState(1);
  const [bookedDates, setBookedDates] = useState([]);
  const [timeBasedBookings, setTimeBasedBookings] = useState([]);
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [error, setError] = useState("");
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAutoFilledDate, setIsAutoFilledDate] = useState(false);
  const [extensionPossible, setExtensionPossible] = useState(true);
  const [maxCheckOutDate, setMaxCheckOutDate] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewCheckOutDate("");
      setNewCheckOutTime("");
      setExtensionHours(1);
      setBookedDates([]);
      setTimeBasedBookings([]);
      setError("");
      setAvailabilityChecked(false);
      setIsAutoFilledDate(false);
      setExtensionPossible(true);
      setMaxCheckOutDate(null);
      if (booking) {
        fetchBookedDates();
      }
    }
  }, [isOpen, booking]);

  // Fetch booked dates for the room
  const fetchBookedDates = async () => {
    if (!booking?.roomId) return;
    
    setIsLoadingBookedDates(true);
    try {
      const response = await api.get(`/rooms/${booking.roomId}/booked-dates`);
      if (response.data) {
        setBookedDates(response.data.bookedDates || []);
        setTimeBasedBookings(response.data.timeBasedBookings || []);
        
        // Check if extension is possible.
        // Checkout is EXCLUSIVE, so the FIRST night an extension claims is the current
        // checkout date itself. getExtensionLimit treats a night as occupied if any
        // regular booking OR any time-based booking holds it (see bookingAvailability.js).
        const bd = response.data.bookedDates || [];
        const tb = response.data.timeBasedBookings || [];
        const { canExtend, maxCheckOut } = availability.getExtensionLimit(
          booking.checkOutDate, bd, tb
        );

        if (!canExtend) {
          // The current checkout night is already booked → no extension is possible at all.
          setExtensionPossible(false);
          setError(
            `This booking can't be extended — the room is already booked on ` +
            `${new Date(booking.checkOutDate).toLocaleDateString()}. ` +
            `Please make a new booking for your desired dates.`
          );
          setAvailabilityChecked(true);
          return;
        }

        if (maxCheckOut) {
          // Latest checkout the guest may pick (they can check out ON it, not past it).
          setMaxCheckOutDate(new Date(maxCheckOut + 'T12:00:00'));

          // If the only claimable night is the current checkout night (boundary is the
          // very next day), there's exactly one valid checkout — auto-fill it.
          const nextDay = new Date(booking.checkOutDate);
          nextDay.setDate(nextDay.getDate() + 1);
          if (maxCheckOut === availability.toDateStr(nextDay)) {
            setNewCheckOutDate(maxCheckOut);
            setIsAutoFilledDate(true);
          }
        }

        setAvailabilityChecked(true);
      }
    } catch (error) {
      
      toast.error('Failed to load booking calendar', {
        description: 'Could not fetch booked dates. Please try again.',
        duration: 6000
      });
      setAvailabilityChecked(true);
    } finally {
      setIsLoadingBookedDates(false);
    }
  };

  // Get minimum date for new checkout (day after current checkout)
  // Since checkout dates are EXCLUSIVE, we can allow same-day extensions
  // (checkout today means leaving today, so room available starting today)
  const getMinCheckOutDate = () => {
    if (!booking?.checkOutDate) return new Date();
    const currentCheckOut = new Date(booking.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if checkout is today
    currentCheckOut.setHours(0, 0, 0, 0);
    const isCheckoutToday = currentCheckOut.getTime() === today.getTime();
    
    if (isCheckoutToday) {
      // Allow same-day extension (checkout today -> checkout today = extending to tomorrow)
      // Check if there are any check-ins TODAY (which would conflict)
      const checkInToday = bookedDates.some(blockedDate => {
        const blocked = new Date(blockedDate);
        blocked.setHours(0, 0, 0, 0);
        return blocked.toDateString() === today.toDateString();
      });
      
      // If no check-in today, allow same-day extension
      if (!checkInToday) {
        return new Date(currentCheckOut);
      }
    }
    
    // Otherwise, require at least one day extension
    const minDate = new Date(currentCheckOut);
    minDate.setDate(minDate.getDate() + 1);
    return minDate;
  };

  // Calculate additional nights/hours and cost
  const calculateExtension = () => {
    if (!booking?.checkOutDate) return { nights: 0, hours: 0, cost: 0, priceBreakdown: null };
    
    if (booking.timeBased) {
      // Time-based booking extension using selected hours
      if (!extensionHours || extensionHours <= 0) return { nights: 0, hours: 0, cost: 0, priceBreakdown: null };
      
      // Price per hour = roomPrice / original hours (for time-based bookings, roomPrice is total for original hours)
      const originalHours = booking.bookHour || 1;
      const pricePerHour = booking.roomPrice / originalHours;
      
      // Calculate extension cost: additional hours × price per hour
      const extensionCost = extensionHours * pricePerHour;

      // GST applies only if the hotel had GST on the original booking (gstRate > 0)
      const gstRate = Number(booking.gstRate) || 0;
      const serviceTax = round2(extensionCost * 0.03);  // 3% service tax on extension
      const gst = round2(extensionCost * gstRate);       // GST on extension (0 when hotel has no GST)

      // Price breakdown
      const priceBreakdown = {
        roomPrice: booking.roomPrice,  // Original room price for the time period
        pricePerHour: pricePerHour,
        extensionHours: extensionHours,
        extendedAmount: round2(extensionCost),  // Cost for extension only (hours × pricePerHour)
        gstRate: gstRate,
        gst: gst,
        serviceTax: serviceTax,
        totalAmount: round2(extensionCost + serviceTax + gst)  // Total with service tax + GST
      };
      
      return { 
        nights: 0, 
        hours: extensionHours, 
        cost: extensionCost >= 0 ? extensionCost : 0,
        priceBreakdown: priceBreakdown
      };
    } else {
      // Regular booking extension
      if (!newCheckOutDate) return { nights: 0, hours: 0, cost: 0, priceBreakdown: null };
      
      // Calculate extension from current checkout to new checkout
      const currentCheckOut = new Date(booking.checkOutDate);
      const newCheckOut = new Date(newCheckOutDate);
      const diffTime = newCheckOut.getTime() - currentCheckOut.getTime();
      let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If same-day extension (selecting today when checkout is today), it extends to tomorrow (1 night)
      if (nights === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        currentCheckOut.setHours(0, 0, 0, 0);
        const isCheckoutToday = currentCheckOut.getTime() === today.getTime();
        
        if (isCheckoutToday) {
          nights = 1; // Same-day extension means extending to tomorrow
        }
      }
      
      // roomPrice is the price PER NIGHT
      const pricePerNight = booking.roomPrice;
      
      // Calculate extension cost: nights × price per night
      const extensionCost = nights > 0 ? nights * pricePerNight : 0;

      // GST applies only if the hotel had GST on the original booking (gstRate > 0)
      const gstRate = Number(booking.gstRate) || 0;
      const serviceTax = round2(extensionCost * 0.03);  // 3% service tax on extension
      const gst = round2(extensionCost * gstRate);       // GST on extension (0 when hotel has no GST)

      // Price breakdown
      const priceBreakdown = {
        roomPrice: booking.roomPrice,  // Price per night
        pricePerNight: pricePerNight,
        extensionNights: nights,
        extendedAmount: round2(extensionCost),  // Cost for extension only (nights × pricePerNight)
        gstRate: gstRate,
        gst: gst,
        serviceTax: serviceTax,
        totalAmount: round2(extensionCost + serviceTax + gst)  // Total with service tax + GST
      };
      
      return { 
        nights: nights > 0 ? nights : 0, 
        hours: 0,
        cost: extensionCost >= 0 ? extensionCost : 0,
        priceBreakdown: priceBreakdown
      };
    }
  };

  // Calculate nights between two dates
  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate - checkInDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights;
  };

  // Calculate new checkout time based on extension hours
  const calculateNewCheckOutTime = () => {
    if (!booking.timeBased || !booking.checkOutTime) return "";
    
    const currentCheckOutTime = booking.checkOutTime;
    const [hours, minutes] = currentCheckOutTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (extensionHours * 60);
    
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (!date) {
      setNewCheckOutDate("");
      setError("");
      return;
    }

    // Check if selected date is the same as current checkout date
    const currentCheckOut = new Date(booking.checkOutDate);
    const selectedDate = new Date(date);
    const today = new Date();
    
    // Reset time to compare only dates
    currentCheckOut.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const isCheckoutToday = currentCheckOut.getTime() === today.getTime();
    const isSameDate = selectedDate.getTime() === currentCheckOut.getTime();
    
    // Allow same-day extension only if:
    // 1. Today is checkout day  
    // 2. No check-in TODAY (which would create overlap)
    if (isSameDate) {
      if (isCheckoutToday) {
        // Check if there's a check-in TODAY (which would create overlap)
        const checkInToday = bookedDates.some(blockedDate => {
          const blocked = new Date(blockedDate);
          blocked.setHours(0, 0, 0, 0);
          return blocked.toDateString() === today.toDateString();
        });
        
        if (checkInToday) {
          setError("You cannot extend your stay today as another guest is already checking in today. Please make a new booking for your desired dates.");
          setNewCheckOutDate("");
          return;
        }
        // If no check-in today, allow same-day extension
      } else {
        setError("You cannot select the same checkout date. Please select a date after your current checkout date.");
        setNewCheckOutDate("");
        return;
      }
    }

    // Format date to YYYY-MM-DD (this becomes the new checkout date)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateValue = `${year}-${month}-${day}`;
    
    // Note: Time-based booking conflicts are now handled at the booking level
    // If we reach this point, the extension is already determined to be possible

    // If same-day extension, we need to check conflicts up to tomorrow (the actual checkout date)
    let endDateForConflictCheck = selectedDate;
    if (isCheckoutToday && isSameDate) {
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      endDateForConflictCheck = tomorrow;
    }

    // Validate that no night in the claimed range [currentCheckOut, newCheckOut) is taken.
    // Checkout is EXCLUSIVE, so a booking on the new-checkout date itself does NOT clash
    // (you leave that morning), but a booking on the current-checkout date or any night
    // in between does. Time-based bookings on those dates count as occupied too.
    // (See extensionHasConflict in bookingAvailability.js — kept in sync with the backend.)
    if (availability.extensionHasConflict(currentCheckOut, endDateForConflictCheck, bookedDates, timeBasedBookings)) {
      setError(`The selected extension period conflicts with existing bookings. Please select a shorter extension period or make a new booking for your desired dates.`);
      setNewCheckOutDate("");
      return;
    }
    
    // If we reach here, the date is valid
    setNewCheckOutDate(dateValue);
    setIsAutoFilledDate(false); // Clear auto-fill flag when user manually selects a date
    setError("");
  };

  // Handle extension hours change for time-based bookings
  const handleExtensionHoursChange = (hours) => {
    const numHours = parseInt(hours);
    setExtensionHours(numHours);
    setError("");

    // Check for time conflicts with existing time-based bookings
    if (booking.timeBased && booking.checkOutDate && numHours > 0) {
      const currentCheckOutTime = booking.checkOutTime || "12:00";
      const [currentHours, currentMinutes] = currentCheckOutTime.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      
      // Calculate new checkout time based on extension hours
      const newTotalMinutes = currentTotalMinutes + (numHours * 60);
      
      // Get existing bookings for the same date
      const selectedDate = new Date(booking.checkOutDate);
      const selectedDateString = selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0');

      const existingBookings = timeBasedBookings.filter(booking => booking.date === selectedDateString);
      
      // Check for time conflicts
      const hasTimeConflict = existingBookings.some(existingBooking => {
        // Handle different time formats (HH:MM:SS or HH:MM)
        let existingStartTime = existingBooking.checkInTime;
        let existingEndTime = existingBooking.checkOutTime;
        
        // Remove seconds if present (e.g., "19:00:00" -> "19:00")
        if (existingStartTime.includes(':') && existingStartTime.split(':').length === 3) {
          existingStartTime = existingStartTime.substring(0, 5);
        }
        if (existingEndTime.includes(':') && existingEndTime.split(':').length === 3) {
          existingEndTime = existingEndTime.substring(0, 5);
        }

        // Calculate existing booking time range
        const [existingStartHours, existingStartMins] = existingStartTime.split(':').map(Number);
        const [existingEndHours, existingEndMins] = existingEndTime.split(':').map(Number);
        
        const existingStartTotalMinutes = existingStartHours * 60 + existingStartMins;
        const existingEndTotalMinutes = existingEndHours * 60 + existingEndMins;

        // Add 1-hour buffer (60 minutes) to existing booking end time
        const existingEndWithBuffer = existingEndTotalMinutes + 60;

        // Check for overlap with buffer - two time ranges overlap if one starts before the other ends (with buffer)
        return (currentTotalMinutes < existingEndWithBuffer && newTotalMinutes > existingStartTotalMinutes);
      });

      if (hasTimeConflict) {
        setError(`This ${numHours}-hour extension conflicts with an existing hourly booking. Please choose fewer hours or a different time.`);
      }
    }
  };

  // Handle extend booking
  const handleExtendBooking = async () => {
    if (booking.timeBased) {
      // Time-based booking extension
      if (!extensionHours || extensionHours <= 0 || error) return;
      
      const extension = calculateExtension();
      // Require at least one hour extension
      if (extension.hours <= 0) {
        setError("Please select a valid extension duration (at least one hour).");
        return;
      }
    } else {
      // Regular booking extension
      if (!newCheckOutDate || error) return;
      
      const extension = calculateExtension();
      // Require at least one night extension (or same-day extension if tomorrow is free)
      if (extension.nights <= 0) {
        setError("Please select a valid extension date.");
        return;
      }
    }

    setIsExtending(true);
    try {
      const extension = calculateExtension();
      const breakdown = extension.priceBreakdown;
      
      if (!breakdown) {
        setError("Unable to calculate extension cost. Please try again.");
        return;
      }
      
      // 🔐 SECURITY FIX: Calculate prices for DISPLAY only
      // These are NOT sent to backend - server recalculates from database
      const displayExtendedAmount = Math.ceil(breakdown.extendedAmount);
      const displayTotalPrice = Math.ceil(breakdown.extendedAmount);
      const displayTxnTotalPrice = Math.ceil(breakdown.totalAmount);
      
      // Security: Display prices calculated (NOT sent to server)
      
      const payload = {
        guests: booking.guests,               
        phone: booking.phone,                 
        destination: booking.destination,     
        origin: booking.origin,               
        extension: true,
        // ❌ REMOVED: Pricing fields (extendedAmount, totalPrice, txnTotalPrice)
        // Backend will recalculate these from database to prevent price manipulation
        // Old code (vulnerable):
        // extendedAmount: extendedAmount.toString(),
        // totalPrice: totalPrice.toString(),
        // txnTotalPrice: txnTotalPrice.toString(),
      };

      // Add time-based or date-based extension fields
      if (booking.timeBased) {
        payload.newCheckOutTime = calculateNewCheckOutTime();
        payload.timeBased = true;
        payload.bookHour = extension.hours;
      } else {
        // If same-day extension (selecting today when checkout is today), send tomorrow's date
        const currentCheckOut = new Date(booking.checkOutDate);
        const selected = new Date(newCheckOutDate);
        const today = new Date();
        
        currentCheckOut.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const isCheckoutToday = currentCheckOut.getTime() === today.getTime();
        const isSameDate = selected.getTime() === currentCheckOut.getTime();
        
        if (isCheckoutToday && isSameDate) {
          // Same-day extension means extending to tomorrow
          const tomorrow = new Date(currentCheckOut);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const year = tomorrow.getFullYear();
          const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
          const day = String(tomorrow.getDate()).padStart(2, '0');
          payload.newCheckOutDate = `${year}-${month}-${day}`;
        } else {
          payload.newCheckOutDate = newCheckOutDate;
        }
      }

      const response = await api.put(`/bookings/${booking.id}/extend`, payload);
      
      if (response.status === 200) {
        const extensionResponse = response.data;
        
        // Check if payment is required for the extension (NVP in-app flow)
        if (extensionResponse.success && (extensionResponse.orderNumber || extensionResponse.paymentUrl)) {
          // Handle in-app payment for booking extension
          handleExtensionPaymentRedirect(extensionResponse);
        } else {
          // Direct extension without payment (fallback)
          // Calculate the actual checkout date for the message
          let actualCheckoutDate = newCheckOutDate;
          const currentCheckOut = new Date(booking.checkOutDate);
          const selected = new Date(newCheckOutDate);
          const today = new Date();
          
          currentCheckOut.setHours(0, 0, 0, 0);
          selected.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          
          const isCheckoutToday = currentCheckOut.getTime() === today.getTime();
          const isSameDate = selected.getTime() === currentCheckOut.getTime();
          
          if (isCheckoutToday && isSameDate) {
            // Same-day extension means extending to tomorrow
            const tomorrow = new Date(currentCheckOut);
            tomorrow.setDate(tomorrow.getDate() + 1);
            actualCheckoutDate = tomorrow.toISOString().split('T')[0];
          }
          
          const extensionDescription = booking.timeBased 
            ? `Your hourly booking has been extended by ${extension.hours} hour${extension.hours !== 1 ? 's' : ''} until ${calculateNewCheckOutTime()}.`
            : `Your stay has been extended until ${new Date(actualCheckoutDate).toLocaleDateString()}.`;
            
          toast.success("Booking extended successfully!", {
            description: extensionDescription,
            duration: 6000
          });
          onExtend(extensionResponse);
          onClose();
        }
      }
    } catch (error) {

      // Handle specific error cases
      if (error.response?.status === 409) {
        setError("The selected dates/times are no longer available. Please choose different dates/times.");
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || "Invalid extension request. Please check your dates/times.");
      } else {
        toast.error("Failed to extend booking", {
          description: "There was an error processing your extension. Please try again.",
          duration: 6000
        });
      }
    } finally {
      setIsExtending(false);
    }
  };

  const handleExtensionPaymentRedirect = (extensionResponse) => {
    if (!extensionResponse?.orderNumber) {
      toast.error("Payment Initiation Failed", {
        description: "Extension payment could not be started. Please try again.",
        duration: 6000
      });
      return;
    }

    onClose();
    navigate("/payment", {
      state: {
        orderNumber: extensionResponse.orderNumber,
        amount: extensionResponse.additionalCost,
        bookingId: booking.id,
        isExtension: true,
        returnPath: "/guestDashboard",
      },
    });
  };

  // Check if extension is possible
  const canExtend = () => {
    if (!booking) return false;
    
    // Get today's date at midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get checkout date at midnight for accurate comparison
    const checkOutDate = new Date(booking.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // Can extend if checkout is today or in the future (including same day)
    return checkOutDate >= today;
  };

  if (!isOpen || !booking) return null;

  const extension = calculateExtension();
  const minDate = getMinCheckOutDate();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-neutral-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-neutral-900">Extend Your Stay</p>
            <p className="text-[12px] text-neutral-500">{booking.hotelName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <X size={14} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!canExtend() && (
            <div className="border-l-4 border-l-red-500 bg-red-50 px-4 py-3 rounded-r-md">
              <p className="text-[13px] text-red-800">
                This booking cannot be extended as the checkout date has already passed.
              </p>
            </div>
          )}

          {canExtend() && (
            <>
              {/* Current Booking Info */}
              <div className="bg-neutral-50 rounded-md p-4 border border-neutral-100">
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest mb-2">Current Booking</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[12px] text-neutral-500">Check-in</span>
                    <span className="text-[12px] font-medium text-neutral-900">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[12px] text-neutral-500">Current Check-out</span>
                    <span className="text-[12px] font-medium text-neutral-900">{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[12px] text-neutral-500">Room</span>
                    <span className="text-[12px] font-medium text-neutral-900">#{booking.roomNumber}</span>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {isLoadingBookedDates && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-200 border-t-neutral-700 animate-spin flex-shrink-0"></div>
                  <span className="text-[12px] text-neutral-600">Loading availability…</span>
                </div>
              )}

              {/* Date Picker for regular bookings */}
              {availabilityChecked && !booking.timeBased && extensionPossible && (
                <div className="space-y-2">
                  <CustomDatePicker
                    selectedDate={newCheckOutDate ? new Date(newCheckOutDate + 'T12:00:00') : null}
                    onDateSelect={handleDateSelect}
                    blockedDates={bookedDates}
                    timeBasedBookings={timeBasedBookings}
                    minDate={minDate}
                    maxDate={maxCheckOutDate}
                    placeholder="Select new checkout date"
                    label="New Check-out Date *"
                    error={error}
                    disabled={isLoadingBookedDates}
                    className="w-full"
                  />
                  {isAutoFilledDate && newCheckOutDate && (
                    <div className="border-l-4 border-l-neutral-400 bg-neutral-50 px-3 py-2.5 rounded-r-md">
                      <p className="text-[12px] text-neutral-700">
                        Checkout extended to {new Date(newCheckOutDate).toLocaleDateString()} — another guest is checking in that day.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Hour Selection for time-based bookings */}
              {availabilityChecked && booking.timeBased && (
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-neutral-700">Extension Duration *</label>
                  <select
                    value={extensionHours}
                    onChange={(e) => handleExtensionHoursChange(e.target.value)}
                    className={`w-full h-9 px-3 border rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-neutral-950/10 ${
                      error ? "border-red-400" : "border-neutral-200"
                    }`}
                    disabled={isLoadingBookedDates}
                  >
                    {Array.from({ length: 4 }, (_, i) => i + 1).map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  {error && <p className="text-[12px] text-red-500">{error}</p>}
                  <p className="text-[11px] text-neutral-500">
                    Current checkout: {booking.checkOutTime || "12:00"}
                    {extensionHours > 0 && (
                      <span className="ml-2 font-medium text-neutral-700">→ New: {calculateNewCheckOutTime()}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Extension Summary */}
              {((booking.timeBased && extension.hours > 0 && !error && extensionHours > 0) ||
                (!booking.timeBased && extension.nights > 0 && !error && newCheckOutDate)) && (
                <div className="border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-3 rounded-r-md">
                  <p className="text-[12px] font-semibold text-emerald-900 mb-2">Extension Summary</p>
                  <div className="space-y-1">
                    {booking.timeBased ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">Current check-out time</span>
                          <span className="text-[12px] font-medium text-emerald-900">{booking.checkOutTime || "12:00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">New check-out time</span>
                          <span className="text-[12px] font-medium text-emerald-900">{calculateNewCheckOutTime()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">Additional hours</span>
                          <span className="text-[12px] font-medium text-emerald-900">{extension.hours} hour{extension.hours !== 1 ? 's' : ''}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">Current check-out</span>
                          <span className="text-[12px] font-medium text-emerald-900">{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">New check-out</span>
                          <span className="text-[12px] font-medium text-emerald-900">{new Date(newCheckOutDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-emerald-700">Additional nights</span>
                          <span className="text-[12px] font-medium text-emerald-900">{extension.nights} night{extension.nights !== 1 ? 's' : ''}</span>
                        </div>
                      </>
                    )}

                    {extension.priceBreakdown && (
                      <div className="pt-2 mt-1 border-t border-emerald-200 space-y-1">
                        {booking.timeBased ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-[11px] text-emerald-700">Original room price</span>
                              <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.roomPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[11px] text-emerald-700">Price per hour</span>
                              <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.pricePerHour)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[11px] text-emerald-700">Extension ({extension.hours} hr{extension.hours !== 1 ? 's' : ''})</span>
                              <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.extendedAmount)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-[11px] text-emerald-700">Original room price</span>
                              <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.roomPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[11px] text-emerald-700">Extension ({extension.nights} night{extension.nights !== 1 ? 's' : ''})</span>
                              <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.extendedAmount)}</span>
                            </div>
                          </>
                        )}
                        {extension.priceBreakdown.gst > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[11px] text-emerald-700">GST ({Math.round((extension.priceBreakdown.gstRate || 0) * 100)}%)</span>
                            <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.gst)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[11px] text-emerald-700">Service tax (3%)</span>
                          <span className="text-[11px] text-emerald-900">{formatCurrency(extension.priceBreakdown.serviceTax)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-200">
                          <span className="text-[12px] font-semibold text-emerald-900">Total amount</span>
                          <span className="text-[12px] font-bold tabular-nums text-emerald-900">{formatCurrency(extension.priceBreakdown.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No availability note */}
              {availabilityChecked && bookedDates.length > 0 && !error && (
                <div className="border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 rounded-r-md">
                  <p className="text-[12px] text-amber-800">
                    Some dates may be unavailable. If your desired dates aren't available, consider making a new booking.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="border-l-4 border-l-red-500 bg-red-50 px-4 py-3 rounded-r-md">
                  <p className="text-[13px] font-medium text-red-900 mb-1">Extension Not Available</p>
                  <p className="text-[12px] text-red-700 mb-2">{error}</p>
                  {error.includes("tomorrow onwards") && (
                    <Link
                      to="/hotel"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-red-700 hover:text-red-900 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Browse Available Hotels
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {canExtend() && (
          <div className="flex gap-2 px-5 py-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="flex-1 h-9 px-4 border border-neutral-200 bg-white text-neutral-600 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExtendBooking}
              disabled={
                (booking.timeBased ? !extensionHours || extensionHours <= 0 : !newCheckOutDate) ||
                (booking.timeBased ? extension.hours <= 0 : extension.nights <= 0) ||
                error ||
                isExtending
              }
              className="flex-1 h-9 px-4 bg-neutral-950 text-white text-[13px] font-medium rounded-md hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExtending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Extending…
                </span>
              ) : (
                `Extend ${booking.timeBased ? 'Time' : 'Stay'} (${formatCurrency(extension.priceBreakdown?.totalAmount || extension.cost)})`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({
  booking,
  onCancel,
  onContact,
  onDirections,
  onExtend,
  onReview,
  onDownloadReceipt,
}) => {
  const config = statusConfig[booking.status] || statusConfig.PENDING; // Fallback to PENDING if status not found
  const isCancellationRequested = booking.status === "CANCELLATION_REQUESTED";
  const isCancellationRejected = booking.status === "CANCELLATION_REJECTED";
  const isCancellationApproved = booking.status === "BOOKING_CANCELLATION_APPROVED";
  const isDisabled = booking.status === "CANCELLED" || isCancellationRequested || isCancellationApproved;
  const isCheckedOut = booking.status === "CHECKED_OUT";

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateWithDay = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysDifference = (checkIn) => {
    const today = new Date();
    const checkInDate = new Date(checkIn);
    const diffTime = checkInDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate - checkInDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights;
  };

  const daysUntilCheckIn = getDaysDifference(booking.checkInDate);
  const numberOfNights = calculateNights(
    booking.checkInDate,
    booking.checkOutDate
  );

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div
      className={`relative rounded-lg p-5 transition-all duration-200 border ${
        isCheckedOut
          ? "bg-neutral-50 border-neutral-200"
          : isCancellationRequested
            ? "bg-amber-50/40 border-amber-200"
            : isCancellationRejected
              ? "bg-orange-50/40 border-orange-200"
              : "bg-white border-neutral-200"
      } ${isDisabled ? "opacity-60 pointer-events-none" : ""}`}
    >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className={`text-[15px] font-semibold tracking-tight mb-1 ${isDisabled ? "text-neutral-400" : "text-neutral-950"}`}>
              {booking.hotelName || "Hotel"}
            </h3>
            {(booking.status === "CONFIRMED" ||
              booking.status === "CHECKED_IN" ||
              booking.status === "CANCELLATION_REJECTED" ||
              booking.status === "BOOKING_CANCELLATION_APPROVED") &&
              booking.hotelPhone && (
              <div className="flex items-center gap-1.5 mb-1">
                <Phone size={12} className="text-emerald-600 flex-shrink-0" />
                <p className="text-[13px] font-medium text-emerald-700">
                  {booking.hotelPhone}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-neutral-500">
              {booking.hotelDistrict && (
                <span>{booking.hotelDistrict} District</span>
              )}
              <span>Room No: #{booking.roomNumber}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Extension Badge */}
        <ExtensionBadge booking={booking} />

        {/* Stay Details */}
        <div className="bg-neutral-50 rounded-md p-3 mb-4 border border-neutral-100">
          <div className="grid grid-cols-3 gap-2">

            <div className="flex items-start gap-1.5 sm:gap-2">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-200 rounded-md flex items-center justify-center mt-0.5">
                <Calendar className="text-neutral-600" size={11} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Check-in</p>
                <p className={`text-[12px] sm:text-[13px] font-semibold leading-snug ${isDisabled ? "text-neutral-400" : "text-neutral-900"}`}>
                  {formatDateWithDay(booking.checkInDate)}
                  {booking.timeBased && booking.checkInTime && (
                    <span className="block text-[10px] text-neutral-500 font-normal">at {formatTime(booking.checkInTime)}</span>
                  )}
                </p>
                {!booking.timeBased && booking.hotelCheckinTime && (
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    {formatTime(booking.hotelCheckinTime)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 sm:gap-2">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-200 rounded-md flex items-center justify-center mt-0.5">
                <Calendar className="text-neutral-600" size={11} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Check-out</p>
                <p className={`text-[12px] sm:text-[13px] font-semibold leading-snug ${isDisabled ? "text-neutral-400" : "text-neutral-900"}`}>
                  {formatDateWithDay(booking.checkOutDate)}
                  {booking.timeBased && booking.checkOutTime && (
                    <span className="block text-[10px] text-neutral-500 font-normal">at {formatTime(booking.checkOutTime)}</span>
                  )}
                </p>
                {!booking.timeBased && booking.hotelCheckoutTime && (
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    {formatTime(booking.hotelCheckoutTime)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 sm:gap-2">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-200 rounded-md flex items-center justify-center mt-0.5">
                <Clock className="text-neutral-600" size={11} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Duration</p>
                <p className={`text-[12px] sm:text-[13px] font-semibold ${isDisabled ? "text-neutral-400" : "text-neutral-900"}`}>
                  {booking.timeBased && booking.bookHour ? (
                    `${booking.bookHour} hr${booking.bookHour !== 1 ? "s" : ""}`
                  ) : (
                    `${numberOfNights} night${numberOfNights !== 1 ? "s" : ""}`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest, Price, and Passcode Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-100 rounded-md flex items-center justify-center">
              <User className="text-neutral-500" size={12} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Guests</p>
              <p className={`text-[12px] sm:text-[13px] font-semibold ${isDisabled ? "text-neutral-400" : "text-neutral-900"}`}>
                {booking.guests} Guest{booking.guests !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-100 rounded-md flex items-center justify-center">
              <CreditCard className="text-neutral-500" size={12} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Total Amount</p>
              <p className={`text-[13px] sm:text-[14px] font-bold tabular-nums ${isDisabled ? "text-neutral-400" : "text-neutral-950"}`}>
                {formatCurrency(booking.txnTotalPrice || booking.totalPrice)}
              </p>
            </div>
          </div>
          {booking.passcode && (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-100 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 leading-tight">Room Passcode</p>
                <p className={`text-[12px] sm:text-[13px] font-mono font-bold tracking-widest ${isDisabled ? "text-neutral-400" : "text-neutral-950"}`}>
                  {booking.passcode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming booking indicator */}
        {booking.status === "CONFIRMED" &&
          daysUntilCheckIn <= 7 &&
          daysUntilCheckIn > 0 && (
            <div className="flex items-center gap-2.5 border-l-4 border-l-neutral-900 bg-neutral-50 px-4 py-2.5 rounded-r-md mb-4">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-[13px] text-neutral-800 font-medium">
                Check-in in {daysUntilCheckIn} day{daysUntilCheckIn !== 1 ? "s" : ""}
              </p>
            </div>
          )}

        {/* Today check-in indicator */}
        {booking.status === "CONFIRMED" && daysUntilCheckIn === 0 && (
          <div className="flex items-center gap-2.5 border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-2.5 rounded-r-md mb-4">
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={14} />
            <p className="text-[13px] text-emerald-800 font-semibold">Check-in Today!</p>
          </div>
        )}

        {/* Cancellation rejected indicator */}
        {booking.status === "CANCELLATION_REJECTED" && (
          <div className="border-l-4 border-l-orange-500 bg-orange-50 px-4 py-3 rounded-r-md mb-4">
            <p className="text-[13px] font-medium text-orange-900 mb-0.5">Cancellation Request Rejected</p>
            <p className="text-[12px] text-orange-700">
              Your cancellation request was not approved. Your booking remains active and you can proceed with your stay as planned.
            </p>
          </div>
        )}

        {/* Cancellation approved indicator */}
        {booking.status === "CANCELLED" && (
          <div className="border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-3 rounded-r-md mb-4">
            <p className="text-[13px] font-medium text-emerald-900 mb-1">Cancellation Approved</p>
            <p className="text-[12px] text-emerald-700 mb-2">
              Your cancellation request has been approved. Your booking has been cancelled.
            </p>
            <p className="text-[12px] text-emerald-700">
              Please contact the hotel owner directly to claim your refund.
              {booking.hotelPhone && (
                <span className="ml-1 font-semibold">{booking.hotelPhone}</span>
              )}
            </p>
          </div>
        )}

        {/* Booking Date */}
        <div className="text-[12px] text-neutral-400 mb-4">
          Booked on {formatDate(booking.createdAt)}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
          {config.actions
            .filter(action => {
              // Hide extend button for time-based bookings
              if (action === "extend" && booking.timeBased) {
                return false;
              }
              return true;
            })
            .map((action) => (
            <ActionButton
              key={action}
              action={action}
              disabled={isDisabled}
              onClick={() => {
                if (action === "directions") onDirections(booking);
                else if (action === "contact") onContact(booking);
                else if (action === "extend") onExtend(booking);
                else if (action === "cancel") onCancel(booking);
                else if (action === "review") onReview(booking);
              }}
            />
          ))}
          {/* Download Receipt Button for CONFIRMED, CHECKED_IN, and CHECKED_OUT */}
          {(booking.status === "CONFIRMED" ||
            booking.status === "CHECKED_IN" ||
            booking.status === "CHECKED_OUT") && (
            <ActionButton
              action="receipt"
              disabled={false}
              onClick={() => onDownloadReceipt(booking)}
            />
          )}
        </div>

      {/* Floating WhatsApp Icon for specific statuses */}
      {(booking.status === "CONFIRMED" ||
        booking.status === "CHECKED_IN" ||
        booking.status === "CANCELLATION_REJECTED" ||
        booking.status === "BOOKING_CANCELLATION_APPROVED") &&
        booking.hotelPhone && !isDisabled && (
        <button
          onClick={() => onContact(booking)}
          className="absolute bottom-18 right-3 bg-[#25D366] hover:bg-[#20BA5A] text-white p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label={`Contact ${booking.hotelName} on WhatsApp`}
        >
          {/* Official WhatsApp Icon SVG */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>

          {/* Pulse animation ring */}
          <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></div>
        </button>
      )}
    </div>
  );
};

// Cancellation Confirmation Dialog Component
const CancellationConfirmationDialog = ({ 
  booking, 
  isOpen, 
  onClose, 
  onConfirm, 
  isCancelling = false 
}) => {
  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDaysUntilCheckIn = () => {
    const today = new Date();
    const checkInDate = new Date(booking.checkInDate);
    const diffTime = checkInDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilCheckIn = calculateDaysUntilCheckIn();

  // Parse the cancellation policy to extract refund information
  const parseCancellationPolicy = (policyText) => {
    if (!policyText) return null;
    
    // Extract refund percentages and timeframes
    const refundMatches = policyText.match(/(\d+)% refund ([^,]+)/g);
    const refunds = refundMatches ? refundMatches.map(match => {
      const [, percentage, timeframe] = match.match(/(\d+)% refund (.+)/);
      return { percentage, timeframe: timeframe.trim() };
    }) : [];
    
    return {
      originalText: policyText,
      refunds: refunds
    };
  };

  const policyInfo = parseCancellationPolicy(booking.cancellationPolicy);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg border-t sm:border border-neutral-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-neutral-950">Cancel Booking</p>
            <p className="text-[12px] text-neutral-500 mt-0.5">Review the policy and confirm your request.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
          >
            <X size={14} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Booking Info */}
          <div className="bg-neutral-50 rounded-md p-4 border border-neutral-100">
            <p className="text-[14px] font-semibold text-neutral-900">{booking.hotelName}</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              Room #{booking.roomNumber} · {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
            </p>
            {daysUntilCheckIn > 0 && (
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Check-in in {daysUntilCheckIn} day{daysUntilCheckIn !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-medium text-neutral-700 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-500" />
              Cancellation Policy
            </p>

            {booking.cancellationPolicy ? (
              <div className="space-y-2">
                <div className="border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 rounded-r-md">
                  <p className="text-[13px] text-amber-800 leading-relaxed">{booking.cancellationPolicy}</p>
                </div>
                <div className="border-l-4 border-l-neutral-300 bg-neutral-50 px-4 py-3 rounded-r-md">
                  <p className="text-[12px] font-medium text-neutral-700 mb-0.5">Important</p>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    This request will be reviewed by the hotel owner. Final refund amount may vary based on their specific policy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-l-4 border-l-neutral-200 bg-neutral-50 px-4 py-3 rounded-r-md">
                <p className="text-[13px] font-medium text-neutral-700 mb-0.5">Policy Not Available</p>
                <p className="text-[12px] text-neutral-500">
                  No cancellation policy on file. Please contact the hotel directly for specific terms.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 px-5 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 h-9 px-4 border border-neutral-200 bg-white text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="flex-1 h-9 px-4 bg-red-600 text-white text-[13px] font-medium rounded-md hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCancelling ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={13} className="animate-spin" />
                Submitting…
              </span>
            ) : (
              "Request Cancellation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mb-5">
      <Hotel className="h-8 w-8 text-neutral-400" />
    </div>
    <h3 className="text-[17px] font-semibold text-neutral-900 mb-1.5">
      No bookings yet
    </h3>
    <p className="text-[13px] text-neutral-500 max-w-xs mb-6 leading-relaxed">
      Welcome to Ezeeroom! Start exploring hotels and book your first stay.
    </p>
    <Link
      to="/hotel"
      className="inline-flex items-center h-9 px-5 bg-neutral-950 text-white text-[13px] font-medium rounded-md hover:opacity-85 transition-opacity"
    >
      Browse Hotels
    </Link>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        Refresh
      </button>
    )}
  </div>
);

// Error state component
const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mb-5">
      <AlertCircle className="h-8 w-8 text-red-400" />
    </div>
    <h3 className="text-[17px] font-semibold text-neutral-900 mb-1.5">
      Failed to load bookings
    </h3>
    <p className="text-[13px] text-neutral-500 max-w-xs mb-6 leading-relaxed">
      {error?.message || "Something went wrong while fetching your bookings."}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 h-9 px-5 bg-neutral-950 text-white text-[13px] font-medium rounded-md hover:opacity-85 transition-opacity"
    >
      <RefreshCw size={13} />
      Try Again
    </button>
  </div>
);

// Enhanced pagination component with server-side support
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <p className="text-[12px] text-neutral-500">
        Showing {startItem}–{endItem} of {totalItems} bookings
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={15} className="text-neutral-600" />
        </button>

        {getPageNumbers().map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`dots-${index}`}
              className="px-2 py-1 text-[12px] text-neutral-400"
            >
              …
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              className={`min-w-[32px] h-8 px-2 text-[12px] rounded-md transition-colors cursor-pointer font-medium ${
                currentPage === pageNum
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {pageNum}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
          className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight size={15} className="text-neutral-600" />
        </button>
      </div>
    </div>
  );
};

// Main dashboard component with server-side pagination
const GuestDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [selectedBookingForDirections, setSelectedBookingForDirections] =
    useState(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedBookingForExtend, setSelectedBookingForExtend] = useState(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Review state
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedHotelForReview, setSelectedHotelForReview] = useState(null);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  const { userId } = useAuth();

  const itemsPerPage = 5;

  // Fetch bookings from API with pagination
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // API call - assuming your endpoint returns array directly
      const response = await api.get(`/bookings/user/${userId}`, {
        params: {
          page: page - 1, // Convert to 0-based indexing for backend
          size: itemsPerPage, // Sort by creation date descending
        },
      });

      const data = response.data;

      // Handle array response (your current format)
      if (Array.isArray(data)) {
        setBookings(data);
        // For now, we'll implement client-side pagination since your API returns array
        // You can modify this when you implement server-side pagination
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setTotalItems(data.length);
      } else if (data.content) {
        // Spring Boot Page format (for future use)
        setBookings(data.content);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalElements);
      } else {
        // Custom pagination format
        setBookings(data.bookings || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
      }
    } catch (error) {
      
      setError(error);
      setBookings([]);
      setTotalPages(0);
      setTotalItems(0);
      toast.error("Failed to load bookings. Please try again.", {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchBookings(currentPage);
    }
  }, [userId, currentPage]);

  // Fetch all notifications from backend when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;

      try {
        setLoadingNotifications(true);
        const response = await api.get(`/notifications/user/${userId}`);
        const fetchedNotifications = response.data;

        // Filter notifications to show BOOKING_CREATED, BOOKING_CANCELLATION_REJECTED, and BOOKING_CANCELLATION_APPROVED types
        const filteredNotifications = fetchedNotifications.filter(
          (notif) => notif.type === "BOOKING_CREATED" || notif.type === "BOOKING_CANCELLATION_REJECTED" || notif.type === "BOOKING_CANCELLATION_APPROVED"
        );

        // Sort notifications by createdAt (newest first) and calculate unread count
        const sortedNotifications = filteredNotifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const unreadNotifications = sortedNotifications.filter(
          (notif) => !notif.isRead
        );

        setNotifications(sortedNotifications);
        setUnreadCount(unreadNotifications.length);

      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  // Mark all notifications as read via API
  const markAllNotificationsAsRead = async () => {
    try {
      await api.put(`/notifications/user/${userId}/markAllRead`);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      
    }
  };

  // Delete all notifications via API
  const deleteAllNotifications = async () => {
    try {
      await api.delete(`/notifications/user/${userId}`);

      // Update local state
      setNotifications([]);
      setUnreadCount(0);

      // Notifications deleted
    } catch (error) {
      // Error handled silently
    }
  };

  // Note: Real-time notifications were previously handled via WebSocket
  // For now, notifications will need to be fetched manually or via polling

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Handle notification dropdown click
  const handleNotificationClick = async () => {
    setShowNotifications((prev) => !prev);

    // Mark all as read when opening dropdown (only if there are unread notifications)
    if (!showNotifications && unreadCount > 0) {
      await markAllNotificationsAsRead();
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // fetchBookings will be called automatically by useEffect when currentPage changes
    }
  };

  // Retry function
  const handleRetry = () => {
    fetchBookings(currentPage);
  };

  const handleCancel = (booking) => {
    setSelectedBookingForCancel(booking);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedBookingForCancel) return;

    setIsCancelling(true);
    try {
      const response = await api.post(`/bookings/${selectedBookingForCancel.id}/request-cancellation`, null, {
        params: {
          userId: userId
        }
      });
      
      // Check if the request was successful (status 200-299)
      if ((response.status >= 200 && response.status < 300) && (response.data?.success === true || !('success' in response.data))) {
        toast.success("Cancellation Request Submitted", {
          description: response.data?.message || "Your cancellation request has been submitted successfully.",
          duration: 6000,
        });
        // Optimistically update the local booking status so the card becomes inactive immediately
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBookingForCancel.id
              ? { ...b, status: "CANCELLATION_REQUESTED" }
              : b
          )
        );
        // Close dialog
        setIsCancelDialogOpen(false);
        setSelectedBookingForCancel(null);
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      
      toast.error("Failed to submit cancellation request. Please try again.", {
        description: "There was an error processing your request. Please contact support if the issue persists.",
        duration: 6000,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelDialogClose = () => {
    if (!isCancelling) {
      setIsCancelDialogOpen(false);
      setSelectedBookingForCancel(null);
    }
  };

  const handleContact = (booking) => {
    if (!booking.hotelPhone) {
      toast.error('Hotel contact number not available', {
        duration: 4000,
      });
      return;
    }

    try {
      // Format phone number for WhatsApp (remove any non-digit characters and add country code if needed)
      let phoneNumber = booking.hotelPhone.replace(/\D/g, '');
      
      // If phone number doesn't start with country code, assume it's Bhutan (+975)
      if (!phoneNumber.startsWith('975')) {
        phoneNumber = '975' + phoneNumber;
      }
      
      // Create WhatsApp URL with a default message
      const message = encodeURIComponent(
        `Hi! I have a booking at ${booking.hotelName} (Room: ${booking.roomNumber}, Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}). I would like to get in touch regarding my reservation.`
      );
      
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Opening WhatsApp to contact ${booking.hotelName}`, {
        duration: 3000,
      });
    } catch (error) {
      
      toast.error('Failed to open WhatsApp. Please try again.', {
        duration: 4000,
      });
    }
  };

  const handleDirections = (booking) => {
    setSelectedBookingForDirections(booking);
    setIsDirectionsModalOpen(true);
  };

  const handleExtend = (booking) => {
    setSelectedBookingForExtend(booking);
    setIsExtendModalOpen(true);
  };

  const handleExtendSuccess = (updatedBooking) => {
    // Refresh the bookings list to show updated data
    fetchBookings(currentPage);
    setIsExtendModalOpen(false);
    setSelectedBookingForExtend(null);
  };

  // Review handlers
  const handleOpenReview = (booking) => {
    setSelectedHotelForReview({
      hotelId: booking.hotelId,
      hotelName: booking.hotelName
    });
    setIsReviewSheetOpen(true);
  };

  const handleReviewSubmitSuccess = () => {
    setIsReviewSheetOpen(false);
    setSelectedHotelForReview(null);
    // Note: Success toast is handled by HotelReviewSheet component itself
    // This callback is only for closing the sheet after successful submission
  };

  // Receipt download handler
  const handleDownloadReceipt = async (booking) => {
    try {
      const bookingId = booking.bookingId || booking.id;
      const subscriptionId = booking.subscriptionId;
      
      if (!bookingId && !subscriptionId) {
        toast.error("Invalid Booking/Subscription", {
          description: "Booking or Subscription ID is missing. Cannot generate receipt.",
          duration: 6000,
        });
        return;
      }

      // Determine receipt type and fetch data
      let response;
      if (subscriptionId) {
        // Fetch subscription receipt data
        response = await api.get(`/receipts/subscription/${subscriptionId}`);
      } else {
        // Fetch booking receipt data
        response = await api.get(`/receipts/booking/${bookingId}`);
      }
      
      if (response.status === 200 && response.data && response.data.length > 0) {
        const receiptData = response.data[0]; // API returns an array, get first item
        
        // Generate and download receipt with API data (now async)
        await generateBookingReceipt(booking, receiptData);
        
        const receiptType = receiptData.receiptType || 'BOOKING';
        const receiptTypeLabel = receiptType === 'SUBSCRIPTION' ? 'subscription' : 'booking';
        
        toast.success("Receipt Downloaded", {
          description: `Your ${receiptTypeLabel} receipt has been downloaded successfully.`,
          duration: 6000,
        });
      } else {
        throw new Error("No receipt data found");
      }
    } catch (error) {
      
      toast.error("Failed to Generate Receipt", {
        description: error.response?.data?.message || "There was an error generating your receipt. Please try again.",
        duration: 6000,
      });
    }
  };

  const handleReviewClose = () => {
    setIsReviewSheetOpen(false);
    setSelectedHotelForReview(null);
    // This callback is for closing the sheet without success (e.g., outside click)
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-tight text-neutral-950">
            My Bookings
          </h1>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                disabled={loadingNotifications}
                className="relative w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
              >
                <Bell size={15} className="text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-neutral-950 text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="fixed left-4 right-4 top-14 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 w-auto sm:w-[320px] bg-white border border-neutral-200 rounded-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-neutral-950">Notifications</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-700 animate-spin"></div>
                        <p className="text-[12px] text-neutral-500">Loading…</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                          <Bell size={18} className="text-neutral-400" />
                        </div>
                        <p className="text-[12px] text-neutral-500">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 transition-colors ${notification.isRead ? "bg-white hover:bg-neutral-50" : "bg-neutral-50"}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-[13px] font-medium text-neutral-900 leading-snug">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full flex-shrink-0 mt-1.5"></div>
                                  )}
                                </div>
                                {notification.hotelName && (
                                  <p className="text-[12px] text-neutral-500 mb-0.5">
                                    Hotel: <span className="font-medium text-neutral-700">{notification.hotelName}</span>
                                  </p>
                                )}
                                {notification.roomNumber && (
                                  <p className="text-[12px] text-neutral-500 mb-0.5">
                                    Room: <span className="font-medium text-neutral-700">{notification.roomNumber}</span>
                                  </p>
                                )}
                                {notification.refundAmount && (
                                  <p className="text-[12px] text-neutral-500 mb-0.5">
                                    Refund: <span className="font-medium text-neutral-700">{formatCurrency(notification.refundAmount)}</span>
                                  </p>
                                )}
                                <p className="text-[11px] text-neutral-400 tabular-nums mt-1">
                                  {notification.displayTime || new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors flex-shrink-0"
            >
              <Home size={12} />
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(itemsPerPage)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : bookings.length === 0 ? (
          <EmptyState onRetry={handleRetry} />
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  onContact={handleContact}
                  onDirections={handleDirections}
                  onExtend={handleExtend}
                  onReview={handleOpenReview}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Google Maps Directions Modal */}
      <GoogleMapsModal
        booking={selectedBookingForDirections}
        isOpen={isDirectionsModalOpen}
        onClose={() => setIsDirectionsModalOpen(false)}
      />

      {/* Extend Booking Modal */}
      <ExtendBookingModal
        booking={selectedBookingForExtend}
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        onExtend={handleExtendSuccess}
      />

      {/* Cancellation Confirmation Dialog */}
      <CancellationConfirmationDialog
        booking={selectedBookingForCancel}
        isOpen={isCancelDialogOpen}
        onClose={handleCancelDialogClose}
        onConfirm={handleConfirmCancellation}
        isCancelling={isCancelling}
      />

      {/* Hotel Review Sheet */}
      <HotelReviewSheet
        isOpen={isReviewSheetOpen}
        userId={userId}
        hotelId={selectedHotelForReview?.hotelId}
        onSubmitSuccess={handleReviewSubmitSuccess}
        onClose={handleReviewClose}
      />
    </div>
  );
};

export default GuestDashboard;
