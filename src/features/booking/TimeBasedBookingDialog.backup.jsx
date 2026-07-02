import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authentication";
import api from "../../shared/services/Api";
import { useTimeBasedBooking } from "../../shared/hooks/useTimeBasedBooking";

import { Button } from "@/shared/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/shared/components/dialog";
import { cn } from "@/shared/utils";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import { Separator } from "@/shared/components/separator";
import { Switch } from "@/shared/components/switch";
import { AlertTriangle } from "lucide-react";
import { BookingSuccessModal, CustomDatePicker } from "../../shared/components";
import { toast } from "sonner";

export default function TimeBasedBookingDialog({
  isOpen,
  onClose,
  room,
  hotelId,
  hotel,
  onBookingSuccess
}) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [openBookingSuccessModal, setOpenBookingSuccessModal] = useState(false);
  const [successBookingData, setSuccessBookingData] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [timeBasedBookings, setTimeBasedBookings] = useState([]);
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Use the custom hook for time-based booking logic
  const {
    bookingDetails,
    errors,
    setErrors,
    handleInputChange,
    handleDateSelect,
    handleNationalityChange,
    handleGuestsChange,
    handleBookHoursChange,
    resetForm,
    calculateCheckOutTime,
    getFormattedCheckInTime,
    calculateTotalPrice,
    calculateTxnTotalPrice,
    calculateServiceTax,
    calculateBasePrice,
    validateForm,
    getExistingBookingsForDate,
    getBlockedTimeSlots,
    isTimeSlotAvailable,
    hasCheckoutOnSelectedDate,
  } = useTimeBasedBooking(room, timeBasedBookings, bookedDates, hotel?.checkoutTime || "12:00");

  // Fetch booked dates for the room
  const fetchBookedDates = async () => {
    if (!room?.id) return;
    
    setIsLoadingBookedDates(true);
    try {
      const bookedResponse = await api.get(`/rooms/${room.id}/booked-dates`);
      
      if (bookedResponse.data) {
        setBookedDates(bookedResponse.data.bookedDates || []);
        setTimeBasedBookings(bookedResponse.data.timeBasedBookings || []);
      }
    } catch (error) {

      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.info('Please login to view detailed availability', {
          description: 'You can still proceed with booking, but some dates may appear available when they are not.',
          duration: 4000
        });
      } else {
        toast.error('Failed to load booking calendar', {
          description: 'Could not fetch booked dates. Some dates may appear available when they are not.',
          duration: 4000
        });
      }
    } finally {
      setIsLoadingBookedDates(false);
    }
  };

  // Get blocked dates for hourly booking.
  // Rules:
  // 1. Always block dates with regular overnight bookings.
  // 2. Also block dates that have ONLY time-based bookings but where every
  //    possible 1-hour time slot (in 15-min increments) is already taken,
  //    so the user is not shown the date as selectable only to discover later
  //    that no slot is available.
  const getBlockedDates = () => {
    const alwaysBlocked = new Set(bookedDates);

    // Collect unique dates that have time-based bookings
    const timeBasedDates = [...new Set(timeBasedBookings.map(b => b.date))];

    timeBasedDates.forEach(date => {
      // Skip — regular overnight booking already blocks it
      if (alwaysBlocked.has(date)) return;

      const bookingsOnDate = timeBasedBookings.filter(b => b.date === date);

      // Build blocked intervals (booking window + 1h buffer) for this date
      const intervals = bookingsOnDate.map(b => {
        let start = b.checkInTime || '00:00';
        let end = b.checkOutTime || '01:00';
        if (start.split(':').length === 3) start = start.substring(0, 5);
        if (end.split(':').length === 3) end = end.substring(0, 5);
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return { start: sh * 60 + sm, end: eh * 60 + em + 60 }; // +60 min buffer
      });

      // If the previous day is a regular overnight booking (with no time-based bookings
      // of its own), a standard guest is checking out today, so we can only start
      // after the hotel checkout time.
      let earliestStart = 0;
      const prevDate = new Date(date + 'T12:00:00');
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr =
        prevDate.getFullYear() + '-' +
        String(prevDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(prevDate.getDate()).padStart(2, '0');

      if (bookedDates.includes(prevDateStr)) {
        const prevDayHourly = timeBasedBookings.filter(b => b.date === prevDateStr);
        if (prevDayHourly.length === 0) {
          // Standard overnight guest checking out — apply hotel checkout constraint
          let checkoutStr = hotel?.checkoutTime || '12:00';
          if (checkoutStr.split(':').length === 3) checkoutStr = checkoutStr.substring(0, 5);
          const [ch, cm] = checkoutStr.split(':').map(Number);
          earliestStart = ch * 60 + cm;
        }
      }

      // Scan every 15-min slot from earliestStart to 23:00 looking for a free 1-hour window
      let hasAvailableSlot = false;
      for (let startMin = earliestStart; startMin <= 23 * 60; startMin += 15) {
        const endMin = startMin + 60;
        const blocked = intervals.some(iv => startMin < iv.end && endMin > iv.start);
        if (!blocked) {
          hasAvailableSlot = true;
          break;
        }
      }

      if (!hasAvailableSlot) {
        alwaysBlocked.add(date);
      }
    });

    return [...alwaysBlocked];
  };

  // Helper function to scroll to and focus the first error field
  const scrollToFirstError = (errors) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length === 0) return;

    const fieldPriority = [
      'checkInDate',
      'checkInTime',
      'bookHours',
      'phone',
      'cid',
      'destination',
      'origin',
      'guests'
    ];

    const firstErrorField = fieldPriority.find(field => errors[field]);
    
    if (firstErrorField) {
      setTimeout(() => {
        let elementToFocus = null;
        
        if (firstErrorField === 'checkInDate') {
          elementToFocus = document.querySelector(`[data-field="${firstErrorField}"] input`) ||
                          document.querySelector(`[data-field="${firstErrorField}"] button`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`);
        } else if (firstErrorField === 'guests') {
          elementToFocus = document.querySelector(`[name="${firstErrorField}"]`) ||
                          document.querySelector(`#${firstErrorField}`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`);
        } else {
          elementToFocus = document.querySelector(`[name="${firstErrorField}"]`) ||
                          document.querySelector(`#${firstErrorField}`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`);
        }

        if (elementToFocus) {
          elementToFocus.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          setTimeout(() => {
            elementToFocus.focus();
          }, 300);
        }
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      scrollToFirstError(formErrors);
      return;
    }

    try {
      setIsBookingLoading(true);
      
      // 🔐 SECURITY FIX: Remove client-calculated prices
      // Backend will recalculate prices from database to prevent price manipulation
      // Client prices are for display only and should NEVER be trusted
      const payload = {
        userId: userId,
        hotelId: hotelId,
        roomId: room.id,
        checkInDate: bookingDetails.checkInDate,
        checkInTime: bookingDetails.checkInTime,
        bookHour: bookingDetails.bookHours,
        guests: bookingDetails.guests,
        numberOfRooms: 1,
        // ❌ REMOVED: totalPrice and txnTotalPrice
        // These will be recalculated server-side from database
        // Old code (vulnerable to tampering):
        // totalPrice: calculateTotalPrice(),
        // txnTotalPrice: calculateTxnTotalPrice(),
        phone: bookingDetails.phone,
        cid: bookingDetails.cid,
        destination: bookingDetails.destination,
        origin: bookingDetails.origin,
        guestName: bookingDetails.guestName || "Guest",
        timeBased: true,
        initiatePayment: true,
        adminBooking: false
      };
      
      const res = await api.post("/bookings", payload);
      
      if (res.status === 200) {
        // Check if a payment is required (NVP in-app flow)
        if (res.data?.orderNumber) {
          handleBFSPaymentRedirect(res.data);
          return;
        }
        
        // Prepare booking data for success modal
        const bookingData = {
          ...payload,
          id: res.data?.id || res.data?.bookingId || `booking_${Date.now()}`,
          hotelName: room.hotelName,
          roomNumber: room.roomNumber,
          room: room,
          bookingTime: new Date().toISOString(),
          paymentStatus: res.data?.paymentStatus || 'pending',
          passcode: res.data?.passcode
        };
        
        // Set success data and show modal
        setSuccessBookingData(bookingData);
        setOpenBookingSuccessModal(true);
        
        // Show toast notification
        toast.success("Hourly Booking Successful!", {
          description: "Your room has been booked with hourly details. QR code generated!",
          duration: 6000
        });
        
        // Reset form and close dialog
        resetForm();
        
        onClose();
        
        // Call success callback if provided
        if (onBookingSuccess) {
          onBookingSuccess(bookingData);
        }
      }
    } catch (error) {
      
      toast.error("Hourly Booking Failed", {
        description: "There was conflict while booking. Please try another date or time.",
        duration: 6000
      });
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Navigate to the full-page payment flow
  const handleBFSPaymentRedirect = (bookingResponse) => {
    if (!bookingResponse?.orderNumber) {
      toast.error("Payment Initiation Failed", {
        description: "Payment could not be started. Please try again.",
        duration: 6000
      });
      return;
    }

    resetForm();
    onClose();

    navigate("/payment", {
      state: {
        orderNumber: bookingResponse.orderNumber,
        amount: bookingResponse.txnTotalPrice ?? bookingResponse.totalPrice,
        bookingId: bookingResponse.id ?? bookingResponse.bookingId,
        hotelName: room?.hotelName ?? hotel?.name,
        roomType: room?.roomType ?? room?.type,
        checkIn: bookingResponse.checkInDate,
        checkOut: bookingResponse.checkOutDate,
        nights: bookingResponse.numberOfNights,
        description: `Booking at ${room?.hotelName ?? hotel?.name ?? "Hotel"}`,
      },
    });
  };

  // Fetch booked dates when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchBookedDates();
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const totalPrice = calculateTotalPrice();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Hourly Booking - {room.hotelName}</DialogTitle>
            <DialogDescription>Room {room.roomNumber} - Hourly Booking</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="relative">
            {/* Background dragon image - covers full form */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'url(/images/dragon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
                opacity: 0.15,
                zIndex: 0
              }}
            />
            <div className="relative z-10 flex flex-col">
            <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto pr-2">
              {/* Loading indicator for booked dates */}
              {isLoadingBookedDates && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A 8.001 8.001 0 0 0 4.646 9.646 A 8 8 0 0 1 18 15.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-700">Loading booking calendar...</span>
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Select Your Date & Time</h3>
                
                <div className="grid gap-2">
                  <div data-field="checkInDate">
                    <CustomDatePicker
                      selectedDate={bookingDetails.checkInDate ? new Date(bookingDetails.checkInDate + 'T12:00:00') : null}
                      onDateSelect={(date) => handleDateSelect("checkInDate", date)}
                      blockedDates={getBlockedDates()}
                      minDate={new Date()}
                      placeholder="Select check-in date"
                      label="Check-in Date *"
                      error={errors.checkInDate}
                      disabled={isLoadingBookedDates}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Hourly booking fields */}
                <div className="grid gap-4">
                  <div className="grid gap-2" data-field="checkInTime">
                    <Label htmlFor="checkInTime" className="text-sm">
                      Check-in Time <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {/* Hours Select (12-hour) */}
                      <Select
                        name="checkInTimeHours"
                        value={(function(){
                          const hh = bookingDetails.checkInTime ? parseInt(bookingDetails.checkInTime.split(':')[0], 10) : NaN;
                          if (isNaN(hh)) return '';
                          const h12 = hh % 12 === 0 ? 12 : hh % 12;
                          return h12.toString().padStart(2, '0');
                        })()}
                        onValueChange={(value) => {
                          const current = bookingDetails.checkInTime || '00:00';
                          const [hhStr, mmStr] = current.split(':');
                          const hh = parseInt(hhStr, 10);
                          const ampm = hh >= 12 ? 'PM' : 'AM';
                          let h12 = parseInt(value, 10);
                          let h24 = h12 % 12;
                          if (ampm === 'PM') h24 = h24 + 12;
                          const newH = h24.toString().padStart(2, '0');
                          handleInputChange({ target: { name: 'checkInTime', value: `${newH}:${mmStr || '00'}` } });
                        }}
                      >
                        <SelectTrigger className={`h-10 text-sm ${
                          errors.checkInTime 
                            ? "border-destructive" 
                            : bookingDetails.checkInDate && bookingDetails.checkInTime && bookingDetails.bookHours && 
                              !isTimeSlotAvailable(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours)
                            ? "border-red-500 bg-red-50"
                            : ""
                        }`}>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = (i + 1).toString().padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {/* Minutes Select */}
                      <Select
                        name="checkInTimeMinutes"
                        value={bookingDetails.checkInTime ? bookingDetails.checkInTime.split(':')[1] : ''}
                        onValueChange={(value) => {
                          const current = bookingDetails.checkInTime || '00:00';
                          const [hhStr] = current.split(':');
                          handleInputChange({ target: { name: 'checkInTime', value: `${hhStr}:${value}` } });
                        }}
                      >
                        <SelectTrigger className={`h-10 text-sm ${
                          errors.checkInTime 
                            ? "border-destructive" 
                            : bookingDetails.checkInDate && bookingDetails.checkInTime && bookingDetails.bookHours && 
                              !isTimeSlotAvailable(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours)
                            ? "border-red-500 bg-red-50"
                            : ""
                        }`}>
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {['00', '15', '30', '45'].map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* AM/PM Select */}
                      <Select
                        name="checkInTimeAmPm"
                        value={(function(){
                          const hh = bookingDetails.checkInTime ? parseInt(bookingDetails.checkInTime.split(':')[0], 10) : NaN;
                          if (isNaN(hh)) return '';
                          return hh >= 12 ? 'PM' : 'AM';
                        })()}
                        onValueChange={(ampmVal) => {
                          const current = bookingDetails.checkInTime || '00:00';
                          const [hhStr, mmStr] = current.split(':');
                          let hh = parseInt(hhStr, 10);
                          const isPM = ampmVal === 'PM';
                          hh = hh % 12; // normalize to 0-11
                          if (isPM) hh = hh + 12; // convert to 12-23
                          const newH = hh.toString().padStart(2, '0');
                          handleInputChange({ target: { name: 'checkInTime', value: `${newH}:${mmStr || '00'}` } });
                        }}
                      >
                        <SelectTrigger className={`h-10 text-sm ${
                          errors.checkInTime 
                            ? "border-destructive" 
                            : bookingDetails.checkInDate && bookingDetails.checkInTime && bookingDetails.bookHours && 
                              !isTimeSlotAvailable(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours)
                            ? "border-red-500 bg-red-50"
                            : ""
                        }`}>
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          {['AM','PM'].map((ap) => (
                            <SelectItem key={ap} value={ap}>
                              {ap}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.checkInTime && (
                      <p className="text-sm text-destructive">{errors.checkInTime}</p>
                    )}
                  </div>

                  <div className="grid gap-2" data-field="bookHours">
                    <Label htmlFor="bookHours" className="text-sm">
                      Duration (Hours) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      name="bookHours"
                      value={String(bookingDetails.bookHours)}
                      onValueChange={handleBookHoursChange}
                    >
                      <SelectTrigger className={`w-full h-10 text-sm ${
                        errors.bookHours 
                          ? "border-destructive" 
                          : bookingDetails.checkInDate && bookingDetails.checkInTime && bookingDetails.bookHours && 
                            !isTimeSlotAvailable(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours)
                          ? "border-red-500 bg-red-50"
                          : ""
                      }`}>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 4 }, (_, i) => i + 1).map((hours) => (
                          <SelectItem key={hours} value={String(hours)}>
                            {hours} {hours === 1 ? "hour" : "hours"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bookHours && (
                      <p className="text-sm text-destructive">{errors.bookHours}</p>
                    )}
                  </div>

                  {/* Show checkout time reminder if previous day is booked */}
                  {bookingDetails.checkInDate && hasCheckoutOnSelectedDate(bookingDetails.checkInDate) && (() => {
                    let checkoutTimeStr = hotel?.checkoutTime || "12:00";
                    if (checkoutTimeStr.includes(':') && checkoutTimeStr.split(':').length === 3) {
                      checkoutTimeStr = checkoutTimeStr.substring(0, 5);
                    }
                    
                    const [checkoutHours, checkoutMins] = checkoutTimeStr.split(':').map(Number);
                    const checkoutHour12 = checkoutHours > 12 ? checkoutHours - 12 : (checkoutHours === 0 ? 12 : checkoutHours);
                    const ampm = checkoutHours >= 12 ? 'PM' : 'AM';
                    const formattedCheckoutTime = `${checkoutHour12}:${checkoutMins.toString().padStart(2, '0')} ${ampm}`;
                    
                    return (
                      <div className="flex items-start gap-2.5 rounded-lg border border-l-2 border-slate-200 border-l-slate-400 bg-white px-3 py-2.5 shadow-sm">
                        <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm">
                          <p className="font-medium text-slate-700">Checkout Reminder</p>
                          <p className="text-slate-500 mt-0.5">
                            A guest is checking out on this date. Please select a time <span className="font-semibold text-slate-700">after {formattedCheckoutTime}</span> when the room becomes available.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Existing hourly bookings for selected date */}
                  {bookingDetails.checkInDate && (() => {
                    const blockedTimeSlots = getBlockedTimeSlots(bookingDetails.checkInDate);
                    
                    return blockedTimeSlots.length > 0 && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-l-2 border-slate-200 border-l-amber-400 bg-white px-3 py-2.5 shadow-sm">
                        <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm w-full">
                          <p className="font-medium text-slate-700">Blocked Time Slots</p>
                          <div className="text-slate-500 mt-1 space-y-1">
                            {blockedTimeSlots.map((slot, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span>{slot.startTime} - {slot.endTime} ({slot.duration} {slot.duration === 1 ? 'hour' : 'hours'})</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  slot.status === 'CONFIRMED' ? 'bg-slate-100 text-slate-700' :
                                  slot.status === 'PENDING'   ? 'bg-slate-100 text-slate-600' :
                                  slot.status === 'CANCELLED' ? 'bg-slate-100 text-slate-400 line-through' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {slot.status}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Please choose a different time slot to avoid conflicts with existing bookings.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hourly booking summary */}
                  {bookingDetails.checkInTime && bookingDetails.bookHours && (() => {
                    const hasConflict = bookingDetails.checkInDate && !isTimeSlotAvailable(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours);
                    return (
                      <div className={`flex items-start gap-2.5 rounded-lg border border-l-2 border-slate-200 bg-white px-3 py-2.5 shadow-sm ${hasConflict ? 'border-l-red-400' : 'border-l-slate-300'}`}>
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${hasConflict ? 'text-red-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {hasConflict ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        <div className="text-sm">
                          <p className="font-medium text-slate-700">
                            {hasConflict ? 'Time Slot Conflict Detected' : 'Your Hourly Booking'}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Check-in: {getFormattedCheckInTime()} | Duration: {bookingDetails.bookHours} {bookingDetails.bookHours === 1 ? "hour" : "hours"} | Check-out: {calculateCheckOutTime()}
                          </p>
                          {hasConflict && (
                            <p className="text-xs text-red-400 mt-1.5">
                              This time slot conflicts with an existing booking. Please choose a different time or duration.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <Separator />

              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Guest Information</h3>
                
                <div className="grid gap-2" data-field="phone">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      +975
                    </span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={bookingDetails.phone}
                      onChange={handleInputChange}
                      placeholder="17123456"
                      className={`h-10 pl-14 placeholder:text-muted-foreground/50 ${errors.phone ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Nationality Selection */}
                <div className="grid gap-2">
                  <Label className="text-sm">Nationality </Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">Bhutanese</span>
                    <Switch
                      checked={bookingDetails.isBhutanese}
                      onCheckedChange={handleNationalityChange}
                    />
                  </div>
                </div>

                {/* CID Number - Only show for Bhutanese */}
                {bookingDetails.isBhutanese && (
                  <div className="grid gap-2" data-field="cid">
                    <Label htmlFor="cid" className="text-sm">CID Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="cid"
                      name="cid"
                      type="text"
                      value={bookingDetails.cid}
                      onChange={handleInputChange}
                      placeholder="11 digits"
                      maxLength={11}
                      className={`h-10 text-sm placeholder:text-muted-foreground/50 ${errors.cid ? "border-destructive" : ""}`}
                    />
                    
                    {/* CID Warning Message */}
                    <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-xs text-amber-800">
                        <strong>Important:</strong> Please enter your correct CID number as you will need to present it during check-in for verification.
                      </p>
                    </div>
                    
                    {errors.cid && (
                      <p className="text-sm text-destructive">{errors.cid}</p>
                    )}
                  </div>
                )}

                <div className="grid gap-2" data-field="destination">
                  <Label htmlFor="destination" className="text-sm">Destination <span className="text-destructive">*</span></Label>
                  <Input
                    id="destination"
                    name="destination"
                    type="text"
                    value={bookingDetails.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    className={`h-10 text-sm placeholder:text-muted-foreground/50 ${errors.destination ? "border-destructive" : ""}`}
                  />
                  {errors.destination && (
                    <p className="text-sm text-destructive">{errors.destination}</p>
                  )}
                </div>

                <div className="grid gap-2" data-field="origin">
                  <Label htmlFor="origin" className="text-sm">Origin <span className="text-destructive">*</span></Label>
                  <Input
                    id="origin"
                    name="origin"
                    type="text"
                    value={bookingDetails.origin}
                    onChange={handleInputChange}
                    placeholder="Enter origin"
                    className={`h-10 text-sm placeholder:text-muted-foreground/50 ${errors.origin ? "border-destructive" : ""}`}
                  />
                  {errors.origin && (
                    <p className="text-sm text-destructive">{errors.origin}</p>
                  )}
                </div>

                <div className="grid gap-2" data-field="guests">
                  <Label htmlFor="guests" className="text-sm">
                    Number of Guests <span className="text-destructive">*</span>
                  </Label>
                    <Select
                      name="guests"
                      value={String(bookingDetails.guests)}
                      onValueChange={handleGuestsChange}
                    >
                    <SelectTrigger className={`w-full h-10 text-sm ${errors.guests ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Select guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const maxGuests = room.maxGuests > 0 ? Math.min(room.maxGuests, 6) : 6;
                        return Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} {num === 1 ? "guest" : "guests"}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  {errors.guests && (
                    <p className="text-sm text-destructive">{errors.guests}</p>
                  )}
                  {room.maxGuests > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Maximum {room.maxGuests} guests allowed for this room
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-2 text-sm">
                {bookingDetails.checkInDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in Date</span>
                    <span className="font-medium">
                      {new Date(bookingDetails.checkInDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Price</span>
                  <span className="font-medium">
                    Nu {calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Tax (3%)</span>
                  <span className="font-medium">
                    Nu {calculateServiceTax().toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Price</span>
                  <span>Nu {calculateTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-blue-600">
                  <span>Transaction Total</span>
                  <span>Nu {calculateTxnTotalPrice().toFixed(2)}</span>
                </div>
                
                {/* Date validation helper */}
                {(errors.checkInDate || errors.checkInTime || errors.bookHours) && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-l-2 border-slate-200 border-l-red-400 bg-white px-3 py-2.5 shadow-sm mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">Hourly Booking Issues</p>
                      <p className="text-slate-500 mt-0.5">
                        Please review your date and time selections for hourly booking.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingDetails(prev => ({
                            ...prev,
                            checkInDate: "",
                            checkInTime: "",
                            bookHours: 1
                          }));
                          setErrors(prev => ({
                            ...prev,
                            checkInDate: undefined,
                            checkInTime: undefined,
                            bookHours: undefined
                          }));
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 underline mt-1"
                      >
                        Clear all date/time and start over
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="relative z-10">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isBookingLoading}>
                {isBookingLoading ? "Booking..." : "Book Hourly"}
              </Button>
            </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Success Modal with QR Code */}
      <BookingSuccessModal
        isOpen={openBookingSuccessModal}
        onClose={() => setOpenBookingSuccessModal(false)}
        bookingData={successBookingData}
      />

    </>
  );
}
