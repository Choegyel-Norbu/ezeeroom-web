import { useState, useEffect } from "react";
import { useAuth } from "../authentication";
import api from "../../shared/services/Api";
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
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { CustomDatePicker } from "../../shared/components";
import { useTimeBasedBooking } from "../../shared/hooks/useTimeBasedBooking";
import AdditionalGuestFields, {
  syncAdditionalGuests,
  validateAdditionalGuests,
} from "@/shared/components/AdditionalGuestFields";

// Round a currency amount to exactly 2 decimal places (nearest, HALF_UP) to match
// the backend's PriceCalculationService. Never rounds up to a whole Ngultrum.
const round2 = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

export default function AdminBookingForm({
  hotelId,
  hotelGst = false,
  hotelWalkInServiceChargeEnabled = false,
  hotelWalkInServiceChargePercent = 0,
  hotelWalkInServiceChargeInclusive = false,
  onBookingSuccess,
  isDisabled = false,
}) {
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false);
  const [selectedRoomForDates, setSelectedRoomForDates] = useState(null);
  const [isTimeBasedBooking, setIsTimeBasedBooking] = useState(false);
  const [timeBasedBookings, setTimeBasedBookings] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    roomNumber: "",
    hotelId: hotelId,
    checkInDate: "",
    checkOutDate: "",
    checkInTime: "",
    bookHour: 1,
    guests: 1,
    mealPlanType: "EP",
    phone: "",
    guestName: "",
    cid: "",
    passportNumber: "",
    destination: "",
    origin: "",
    isBhutanese: true,
    additionalGuests: [],
  });
  const [errors, setErrors] = useState({});
  const [discountAmount, setDiscountAmount] = useState("");
  const [waiveWalkInServiceCharge, setWaiveWalkInServiceCharge] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [journalNumber, setJournalNumber] = useState("");

  // Get selected room for time-based booking hook
  const selectedRoomForHook = availableRooms.find(room => room.roomNumber === bookingDetails.roomNumber);

  // Use time-based booking hook for admin context
  const {
    bookingDetails: timeBasedDetails,
    errors: timeBasedErrors,
    setBookingDetails: setTimeBasedDetails,
    setErrors: setTimeBasedErrors,
    handleInputChange: handleTimeBasedInputChange,
    handleDateSelect: handleTimeBasedDateSelect,
    handleNationalityChange: handleTimeBasedNationalityChange,
    handleGuestsChange: handleTimeBasedGuestsChange,
    handleBookHoursChange: handleTimeBasedBookHoursChange,
    resetForm: resetTimeBasedForm,
    calculateCheckOutTime,
    getFormattedCheckInTime,
    calculateGst: calculateTimeBasedRoomGst,
    calculateBasePrice: calculateTimeBasedBasePrice,
    validateForm: validateTimeBasedForm,
    getExistingBookingsForDate,
    getBlockedTimeSlots,
    isTimeSlotAvailable,
  } = useTimeBasedBooking(selectedRoomForHook, timeBasedBookings, bookedDates, "12:00");

  useEffect(() => {
    if (hotelId) {
      fetchAvailableRooms();
    }
  }, [hotelId]);

  const fetchAvailableRooms = async (showErrorToast = true) => {
    try {
      setLoading(true);
      const response = await api.get(`/rooms/available/${hotelId}?page=0&size=50`);
      setAvailableRooms(response.data.content || []);
    } catch (error) {
      
      if (showErrorToast) {
        toast.error("Failed to fetch available rooms", {
          duration: 6000
        });
      }
      throw error; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  };

  // Fetch booked dates for the selected room
  const fetchBookedDates = async (roomId) => {
    if (!roomId) return;
    
    setIsLoadingBookedDates(true);
    try {
      const response = await api.get(`/rooms/${roomId}/booked-dates`);
      if (response.data) {
        setBookedDates(response.data.bookedDates || []);
        setTimeBasedBookings(response.data.timeBasedBookings || []);
        setSelectedRoomForDates(roomId);
      }
    } catch (error) {
      
      toast.error('Failed to load booking calendar', {
        description: 'Could not fetch booked dates. Some dates may appear available when they are not.',
        duration: 4000
      });
      // Reset to empty array on error to show all dates as available
      setBookedDates([]);
      setTimeBasedBookings([]);
    } finally {
      setIsLoadingBookedDates(false);
    }
  };

  // Helper function to check if a date is between two booked dates
  const isDateBetweenBookedDates = (dateString) => {
    if (!dateString || bookedDates.length === 0) return false;
    
    const selectedDate = new Date(dateString);
    const selectedDateString = selectedDate.getFullYear() + '-' + 
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selectedDate.getDate()).padStart(2, '0');
    
    // Sort booked dates to find consecutive bookings
    const sortedBookedDates = [...bookedDates].sort();
    
    for (let i = 0; i < sortedBookedDates.length; i++) {
      const currentBookedDate = new Date(sortedBookedDates[i]);
      const nextDay = new Date(currentBookedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const nextDayString = nextDay.getFullYear() + '-' + 
        String(nextDay.getMonth() + 1).padStart(2, '0') + '-' + 
        String(nextDay.getDate()).padStart(2, '0');
      
      // Check if selected date is the day after a booked date
      if (selectedDateString === nextDayString) {
        // Check if the day after selected date is also booked
        const dayAfterSelected = new Date(selectedDate);
        dayAfterSelected.setDate(dayAfterSelected.getDate() + 1);
        const dayAfterSelectedString = dayAfterSelected.getFullYear() + '-' + 
          String(dayAfterSelected.getMonth() + 1).padStart(2, '0') + '-' + 
          String(dayAfterSelected.getDate()).padStart(2, '0');
        
        if (bookedDates.includes(dayAfterSelectedString)) {
          return true; // Selected date is between two booked dates
        }
      }
    }
    
    return false;
  };

  // Helper function to check if the next day after check-in date is booked
  const isNextDayBooked = (checkInDateString) => {
    if (!checkInDateString || bookedDates.length === 0) return false;
    
    const checkInDate = new Date(checkInDateString);
    const nextDay = new Date(checkInDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const nextDayString = nextDay.getFullYear() + '-' + 
      String(nextDay.getMonth() + 1).padStart(2, '0') + '-' + 
      String(nextDay.getDate()).padStart(2, '0');
    
    return bookedDates.includes(nextDayString);
  };

  // Helper function to check for time conflicts in hourly bookings
  const hasTimeConflict = (date, checkInTime, bookHour) => {
    if (!date || !checkInTime || !bookHour || timeBasedBookings.length === 0) {
      return false;
    }

    const selectedDate = new Date(date);
    const selectedDateString = selectedDate.getFullYear() + '-' + 
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selectedDate.getDate()).padStart(2, '0');

    // Calculate selected booking time range
    const [selectedHours, selectedMinutes] = checkInTime.split(':').map(Number);
    const selectedStartMinutes = selectedHours * 60 + selectedMinutes;
    const selectedEndMinutes = selectedStartMinutes + (bookHour * 60);

    // Check against existing hourly bookings for the same date
    return timeBasedBookings.some(booking => {
      if (booking.date !== selectedDateString) {
        return false;
      }

      // Calculate existing booking time range
      const [existingStartHours, existingStartMins] = booking.checkInTime.split(':').map(Number);
      const [existingEndHours, existingEndMins] = booking.checkOutTime.split(':').map(Number);
      
      const existingStartTotalMinutes = existingStartHours * 60 + existingStartMins;
      const existingEndTotalMinutes = existingEndHours * 60 + existingEndMins;

      // Add 1-hour buffer (60 minutes) to existing booking end time
      const existingEndWithBuffer = existingEndTotalMinutes + 60;

      // Check for overlap with buffer - two time ranges overlap if one starts before the other ends (with buffer)
      return (selectedStartMinutes < existingEndWithBuffer && selectedEndMinutes > existingStartTotalMinutes);
    });
  };

  // Helper function to check if tomorrow has a time-based booking that starts before checkout time
  const hasNextDayTimeBasedBookingConflict = (checkInDateString, checkoutTime = "12:00") => {
    if (!checkInDateString || !timeBasedBookings.length || !checkoutTime) return false;
    
    const checkInDate = new Date(checkInDateString);
    const tomorrow = new Date(checkInDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowString = tomorrow.getFullYear() + '-' + 
      String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
      String(tomorrow.getDate()).padStart(2, '0');
    
    // Check if tomorrow has a time-based booking
    const tomorrowBookings = timeBasedBookings.filter(booking => booking.date === tomorrowString);
    
    if (tomorrowBookings.length === 0) return false;
    
    // Get hotel checkout time and normalize it
    let checkoutTimeStr = checkoutTime;
    if (checkoutTimeStr.includes(':') && checkoutTimeStr.split(':').length === 3) {
      checkoutTimeStr = checkoutTimeStr.substring(0, 5);
    }
    
    const [checkoutHours, checkoutMinutes] = checkoutTimeStr.split(':').map(Number);
    const checkoutTotalMinutes = checkoutHours * 60 + checkoutMinutes;
    
    // Check if any time-based booking on tomorrow starts before checkout time
    return tomorrowBookings.some(booking => {
      if (!booking.checkInTime) return false;
      
      // Normalize checkInTime format
      let checkInTimeStr = booking.checkInTime;
      if (checkInTimeStr.includes(':') && checkInTimeStr.split(':').length === 3) {
        checkInTimeStr = checkInTimeStr.substring(0, 5);
      }
      
      const [bookingHours, bookingMinutes] = checkInTimeStr.split(':').map(Number);
      const bookingTotalMinutes = bookingHours * 60 + bookingMinutes;
      
      // Return true if the booking starts before or at checkout time
      return bookingTotalMinutes <= checkoutTotalMinutes;
    });
  };

  // Helper function to check if a time-based booking is in the afternoon (12 noon and after)
  // This is used to determine which dates should be blocked for standard booking
  const isAfternoonTimeBasedBooking = (booking) => {
    if (!booking.checkInTime) return false;
    
    // Handle different time formats (HH:MM:SS or HH:MM)
    let checkInTime = booking.checkInTime;
    if (checkInTime.includes(':') && checkInTime.split(':').length === 3) {
      checkInTime = checkInTime.substring(0, 5);
    }
    
    const [hours] = checkInTime.split(':').map(Number);
    return hours >= 12; // 12 noon and after
  };

  // Helper function to check if a time-based booking is in the morning (before 12 noon)
  const isMorningTimeBasedBooking = (booking) => {
    if (!booking.checkInTime) return false;
    
    // Handle different time formats (HH:MM:SS or HH:MM)
    let checkInTime = booking.checkInTime;
    if (checkInTime.includes(':') && checkInTime.split(':').length === 3) {
      checkInTime = checkInTime.substring(0, 5);
    }
    
    const [hours] = checkInTime.split(':').map(Number);
    return hours < 12; // Before 12 noon
  };

  // Get blocked dates for regular booking based on booking type
  const getBlockedDates = () => {
    // For standard booking, block dates that have:
    // 1. Regular booked dates (EXCEPT those that only have morning time-based bookings)
    // 2. Dates with ONLY afternoon time-based bookings (12 noon and after, no regular booking)
    // 3. Dates where tomorrow has a time-based booking starting before checkout time
    // 4. Dates that have BOTH a regular booking AND any time-based bookings
    // 5. Previous dates where there's a morning time-based booking (NEW RULE)
    // 
    // This allows standard booking on dates that only have morning time-based bookings (before 12 noon)
    // because morning bookings don't conflict with overnight standard bookings
    
    // Get dates that have afternoon time-based bookings
    const afternoonTimeBasedDates = timeBasedBookings
      .filter(isAfternoonTimeBasedBooking)
      .map(booking => booking.date);
    
    // Get dates that have morning time-based bookings
    const morningTimeBasedDates = timeBasedBookings
      .filter(isMorningTimeBasedBooking)
      .map(booking => booking.date);
    
    // Get dates that have any time-based bookings (morning or afternoon)
    const allTimeBasedDates = timeBasedBookings.map(booking => booking.date);
    
    // Get dates that have BOTH a regular booking AND time-based bookings
    // These should always be blocked as they're fully occupied
    const datesWithBothBookings = bookedDates.filter(date => allTimeBasedDates.includes(date));
    
    // Get dates that have regular bookings WITHOUT time-based bookings
    // Block regular booked dates that don't have time-based bookings
    const regularBookedDatesToBlock = bookedDates.filter(date => !allTimeBasedDates.includes(date));
    
    // Get dates that have ONLY afternoon time-based bookings (no regular booking)
    // These should be blocked for standard bookings as they conflict with overnight stays
    const afternoonOnlyDates = afternoonTimeBasedDates.filter(date => !bookedDates.includes(date));
    
    // Get dates that have time-based booking conflicts on the next day
    // If tomorrow has a time-based booking that starts before checkout time,
    // then today should be blocked for standard bookings
    const datesWithNextDayConflict = [];
    const checkoutTime = "12:00"; // Default checkout time for admin bookings
    if (timeBasedBookings.length > 0) {
      // For each time-based booking, check if it starts before checkout time
      // If so, block the previous day (the check-in day)
      const processedDates = new Set();
      
      timeBasedBookings.forEach(booking => {
        if (!booking.date || !booking.checkInTime) return;
        
        // Normalize checkInTime
        let checkInTimeStr = booking.checkInTime;
        if (checkInTimeStr.includes(':') && checkInTimeStr.split(':').length === 3) {
          checkInTimeStr = checkInTimeStr.substring(0, 5);
        }
        
        // Normalize checkoutTime
        let checkoutTimeStr = checkoutTime;
        if (checkoutTimeStr.includes(':') && checkoutTimeStr.split(':').length === 3) {
          checkoutTimeStr = checkoutTimeStr.substring(0, 5);
        }
        
        const [bookingHours, bookingMinutes] = checkInTimeStr.split(':').map(Number);
        const [checkoutHours, checkoutMinutes] = checkoutTimeStr.split(':').map(Number);
        
        const bookingTotalMinutes = bookingHours * 60 + bookingMinutes;
        const checkoutTotalMinutes = checkoutHours * 60 + checkoutMinutes;
        
        // If booking starts before or at checkout time, block the previous day
        if (bookingTotalMinutes <= checkoutTotalMinutes) {
          const bookingDate = new Date(booking.date);
          const previousDate = new Date(bookingDate);
          previousDate.setDate(previousDate.getDate() - 1);
          
          const previousDateString = previousDate.getFullYear() + '-' + 
            String(previousDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(previousDate.getDate()).padStart(2, '0');
          
          if (!processedDates.has(previousDateString)) {
            datesWithNextDayConflict.push(previousDateString);
            processedDates.add(previousDateString);
          }
        }
      });
    }
    
    // NEW: Get previous dates that should be blocked due to morning time-based bookings
    // If there's a morning time-based booking, block the previous date for standard booking
    // because checkout would conflict with the morning time-based booking
    const datesWithMorningConflict = [];
    if (timeBasedBookings.length > 0) {
      const processedDates = new Set();
      
      timeBasedBookings.forEach(booking => {
        if (!booking.date || !booking.checkInTime) return;
        
        // Check if this is a morning time-based booking
        if (isMorningTimeBasedBooking(booking)) {
          const bookingDate = new Date(booking.date);
          const previousDate = new Date(bookingDate);
          previousDate.setDate(previousDate.getDate() - 1);
          
          const previousDateString = previousDate.getFullYear() + '-' + 
            String(previousDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(previousDate.getDate()).padStart(2, '0');
          
          if (!processedDates.has(previousDateString)) {
            datesWithMorningConflict.push(previousDateString);
            processedDates.add(previousDateString);
          }
        }
      });
    }
    
    // Combine all blocked dates:
    // - Regular booked dates without time-based bookings
    // - Dates with only afternoon time-based bookings
    // - Dates with both regular and time-based bookings
    // - Dates where tomorrow has time-based bookings before checkout
    // - Previous dates where there's a morning time-based booking
    const allBlockedDates = [
      ...regularBookedDatesToBlock, 
      ...afternoonOnlyDates, 
      ...datesWithBothBookings, 
      ...datesWithNextDayConflict,
      ...datesWithMorningConflict
    ];
    return [...new Set(allBlockedDates)]; // Remove duplicates
  };

  // Get blocked dates for hourly booking
  // Block dates based on these rules:
  // 1. Block dates with ONLY regular bookings (no time-based bookings)
  // 2. Block dates with BOTH regular AND time-based bookings
  // 3. Allow dates with ONLY time-based bookings (no regular bookings)
  const getBlockedDatesForHourlyBooking = () => {
    // Get dates that have time-based bookings
    const timeBasedDates = timeBasedBookings.map(booking => booking.date);
    
    // Block dates that have regular bookings (regardless of time-based bookings)
    // This covers both "regular only" and "both regular + time-based" scenarios
    return bookedDates;
  };

  const calculateDays = () => {
    if (!bookingDetails.checkInDate) {
      return 0;
    }
    
    // If check-in date is between booked dates, it's a single night stay
    if (isDateBetweenBookedDates(bookingDetails.checkInDate)) {
      return 1;
    }
    
    // If the next day after check-in is booked, it's a single night stay
    if (isNextDayBooked(bookingDetails.checkInDate)) {
      return 1;
    }
    
    if (!bookingDetails.checkOutDate) {
      return 0;
    }
    
    const checkIn = new Date(bookingDetails.checkInDate);
    const checkOut = new Date(bookingDetails.checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  // Check if checkout date picker should be hidden
  const shouldHideCheckoutDate = () => {
    if (!bookingDetails.checkInDate) return false;
    
    // Hide if check-in date is between two booked dates
    if (isDateBetweenBookedDates(bookingDetails.checkInDate)) {
      return true;
    }
    
    // Hide if the next day after check-in is already booked
    if (isNextDayBooked(bookingDetails.checkInDate)) {
      return true;
    }
    
    return false;
  };

  const getSelectedRoom = () => {
    return availableRooms.find(room => room.roomNumber === bookingDetails.roomNumber);
  };

  // Absolute per-night rate for the chosen plan. EP resolves to the room's base
  // price; CP/MAP/AP resolve to their configured absolute rate.
  const getMealPlanRate = (room, planType) => {
    if (!room) return 0;
    if (!planType || planType === "EP") return room.price;
    const plan = room.mealPlans?.find((mp) => mp.planType === planType);
    return plan?.price ?? room.price;
  };

  // Rounding matches the backend's PriceCalculationService (RoundingMode.HALF_UP to
  // 2 decimal places) so the preview shown here matches what's actually charged.
  const calculateTotalPrice = () => {
    const days = calculateDays();
    const selectedRoom = getSelectedRoom();
    if (!selectedRoom) return 0;
    return round2(days * getMealPlanRate(selectedRoom, bookingDetails.mealPlanType));
  };

  const calculateGst = () => {
    if (!hotelGst) return 0;
    return round2(calculateTotalPrice() * 0.05);
  };

  // Walk-in (admin) bookings are exempt from the platform's service charge;
  // the hotel's own walk-in service charge applies instead, unless waived.
  // Charge is a flat percentage of the room price in BOTH modes
  // (mirrors PriceCalculationServiceImpl.applyWalkInPricing):
  //   charge = roomPrice × rate  (e.g. 10% of 800 = 80)
  //   ADDITIVE  - the charge is added on top of the room price.
  //   INCLUSIVE - the charge is already inside the room price (net = price − charge),
  //               so it's NOT added again to the total.
  const extractOrAddCharge = (roomPrice) => {
    if (!hotelWalkInServiceChargeEnabled || waiveWalkInServiceCharge) return 0;
    const rate = hotelWalkInServiceChargePercent / 100;
    return round2(roomPrice * rate);
  };

  const calculateWalkInServiceCharge = () => extractOrAddCharge(calculateTotalPrice());

  // In inclusive mode the charge is already part of the room price, so it must
  // NOT be added again when building the payable total.
  const walkInChargeAddedToTotal = (charge) =>
    hotelWalkInServiceChargeInclusive ? 0 : charge;

  const calculateAppliedDiscount = () => {
    const requested = parseFloat(discountAmount) || 0;
    if (requested <= 0) return 0;
    const preDiscountTotal = calculateTotalPrice() + calculateGst()
      + walkInChargeAddedToTotal(calculateWalkInServiceCharge());
    return round2(Math.min(requested, preDiscountTotal));
  };

  const calculateTxnTotalPrice = () => {
    return round2(
      calculateTotalPrice() + calculateGst()
        + walkInChargeAddedToTotal(calculateWalkInServiceCharge()) - calculateAppliedDiscount()
    );
  };

  // Same overrides for time-based (hourly) bookings, using the hook's base price/GST.
  const calculateTimeBasedWalkInServiceCharge = () => extractOrAddCharge(calculateTimeBasedBasePrice());

  const calculateTimeBasedAppliedDiscount = () => {
    const requested = parseFloat(discountAmount) || 0;
    if (requested <= 0) return 0;
    const preDiscountTotal = calculateTimeBasedBasePrice() + calculateTimeBasedRoomGst()
      + walkInChargeAddedToTotal(calculateTimeBasedWalkInServiceCharge());
    return round2(Math.min(requested, preDiscountTotal));
  };

  const calculateTimeBasedTxnTotalPriceWithWalkIn = () => {
    return round2(
      calculateTimeBasedBasePrice() + calculateTimeBasedRoomGst()
        + walkInChargeAddedToTotal(calculateTimeBasedWalkInServiceCharge())
        - calculateTimeBasedAppliedDiscount()
    );
  };

  // Helper function to scroll to and focus the first error field
  const scrollToFirstError = (errors) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length === 0) return;

    // Define field priority order for scrolling
    const fieldPriority = [
      'roomNumber',
      'checkInDate',
      'checkOutDate', 
      'guestName',
      'phone',
      'cid',
      'destination',
      'origin'
    ];

    // Find the first error field based on priority
    const firstErrorField = fieldPriority.find(field => errors[field]);
    
    if (firstErrorField) {
      // Small delay to ensure DOM is updated with error states
      setTimeout(() => {
        let elementToFocus = null;
        
        // Handle different field types
        if (firstErrorField === 'checkInDate' || firstErrorField === 'checkOutDate') {
          // For date pickers, try to find the input element
          elementToFocus = document.querySelector(`[data-field="${firstErrorField}"] input`) ||
                          document.querySelector(`[data-field="${firstErrorField}"] button`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`);
        } else if (firstErrorField === 'roomNumber') {
          // For room select field
          elementToFocus = document.querySelector(`[data-field="${firstErrorField}"] button`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`) ||
                          document.querySelector(`[name="${firstErrorField}"]`);
        } else {
          // For regular input fields
          elementToFocus = document.querySelector(`[data-field="${firstErrorField}"] input`) ||
                          document.querySelector(`[name="${firstErrorField}"]`) ||
                          document.querySelector(`#${firstErrorField}`) ||
                          document.querySelector(`[data-field="${firstErrorField}"]`);
        }

        if (elementToFocus) {
          // Scroll to the element
          elementToFocus.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Focus the element after scrolling
          setTimeout(() => {
            elementToFocus.focus();
          }, 300);
        }
      }, 100);
    }
  };

  const validateForm = () => {
    // If time-based booking is enabled, use time-based validation
    if (isTimeBasedBooking) {
      return validateTimeBasedForm();
    }

    const newErrors = {};
    
    if (!bookingDetails.roomNumber) newErrors.roomNumber = "Room number is required";
    // Removed userId validation - now optional for third-party bookings
    if (!bookingDetails.guestName) newErrors.guestName = "Guest name is required";
    
    // Comprehensive check-in date validation
    if (!bookingDetails.checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    } else {
      const checkInDate = new Date(bookingDetails.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
      
      // Check if check-in date is in the past
      if (checkInDate < today) {
        newErrors.checkInDate = "Check-in date cannot be in the past";
      }
      // Check for time-based booking conflict on the next day
      else if (hasNextDayTimeBasedBookingConflict(bookingDetails.checkInDate)) {
        const tomorrow = new Date(checkInDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDisplay = tomorrow.toLocaleDateString();
        newErrors.checkInDate = `Cannot book this date. The next day (${tomorrowDisplay}) has a time-based booking that starts before checkout time.`;
      }
      // Check if it's too far in the future (optional business rule - 1 year max)
      else {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (checkInDate > oneYearFromNow) {
          newErrors.checkInDate = "Check-in date cannot be more than 1 year in advance";
        }
      }
    }
    
    // Validate check-out date (skip if check-in is between booked dates or next day is booked)
    if (!shouldHideCheckoutDate() && !bookingDetails.checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required";
    } else if (bookingDetails.checkOutDate) {
      const checkOutDate = new Date(bookingDetails.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkOutDate <= today) {
        newErrors.checkOutDate = "Check-out date must be after today";
      } else if (bookingDetails.checkInDate) {
        const checkInDate = new Date(bookingDetails.checkInDate);
        if (checkOutDate <= checkInDate) {
          newErrors.checkOutDate = "Check-out date must be after check-in date";
        }
        
        // Check for maximum stay duration (optional business rule - 30 days max)
        else {
          const diffTime = checkOutDate.getTime() - checkInDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 30) {
            newErrors.checkOutDate = "Maximum stay duration is 30 days";
          }
        }
      }
    }

    // Validate CID Number (only required for Bhutanese citizens)
    if (bookingDetails.isBhutanese) {
      if (!bookingDetails.cid.trim()) {
        newErrors.cid = "CID number is required for Bhutanese citizens";
      } else {
        const cid = bookingDetails.cid.trim();
        
        // Rule 1: Must be exactly 11 digits
        if (!/^\d{11}$/.test(cid)) {
          newErrors.cid = "CID must be exactly 11 digits";
        } else {
          // Rule 2: Dzongkhag code must be 01–20
          const dzongkhagCode = parseInt(cid.substring(0, 2), 10);
          if (dzongkhagCode < 1 || dzongkhagCode > 20) {
            newErrors.cid = "Invalid Dzongkhag code (must be 01–20)";
          }
          // Additional validation: Check if it's not all zeros or all same digits
          else if (/^0{11}$/.test(cid)) {
            newErrors.cid = "CID number cannot be all zeros";
          } else if (/^(\d)\1{10}$/.test(cid)) {
            newErrors.cid = "CID number cannot be all same digits";
          }
          // CID is valid if it passes all the above checks
        }
      }
    } else {
      // Validate Passport Number (only required for non-Bhutanese guests)
      if (!bookingDetails.passportNumber.trim()) {
        newErrors.passportNumber = "Passport number is required for non-Bhutanese guests";
      } else {
        const passportNumber = bookingDetails.passportNumber.trim();
        if (!/^[A-Za-z0-9]{5,20}$/.test(passportNumber)) {
          newErrors.passportNumber = "Passport number must be 5-20 letters/digits";
        } else if (/^([A-Za-z0-9])\1+$/.test(passportNumber)) {
          newErrors.passportNumber = "Passport number cannot be all the same character";
        }
      }
    }

    // Validate Destination
    if (!bookingDetails.destination.trim()) {
      newErrors.destination = "Destination is required";
    } else if (bookingDetails.destination.length < 2) {
      newErrors.destination = "Destination must be at least 2 characters long";
    } else if (bookingDetails.destination.length > 50) {
      newErrors.destination = "Destination must not exceed 50 characters";
    } else if (!/^[a-zA-Z\s\-_.,]+$/.test(bookingDetails.destination)) {
      newErrors.destination = "Destination can only contain letters, spaces, hyphens, underscores, commas, and periods";
    }

    // Validate Origin
    if (!bookingDetails.origin.trim()) {
      newErrors.origin = "Origin is required";
    } else if (bookingDetails.origin.length < 2) {
      newErrors.origin = "Origin must be at least 2 characters long";
    } else if (bookingDetails.origin.length > 50) {
      newErrors.origin = "Origin must not exceed 50 characters";
    } else if (!/^[a-zA-Z\s\-_.,]+$/.test(bookingDetails.origin)) {
      newErrors.origin = "Origin can only contain letters, spaces, hyphens, underscores, commas, and periods";
    }

    const validateBhutanesePhone = (phone) => {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      if (!cleanPhone) return "Phone number is required";
      if (!/^\d+$/.test(cleanPhone)) return "Phone number should contain only digits";
      if (cleanPhone.length !== 8) return "Phone number must be exactly 8 digits";
      const mobilePattern = /^(16|17|77)\d{6}$/;
      if (!mobilePattern.test(cleanPhone)) return "Invalid Bhutanese mobile number. Must start with 16, 17, or 77.";
      return null;
    };

    const phoneError = validateBhutanesePhone(bookingDetails.phone);
    if (phoneError) newErrors.phone = phoneError;

    // Validate additional guests' identity (occupants 2..guests)
    const additionalGuestErrors = validateAdditionalGuests(bookingDetails.guests, bookingDetails.additionalGuests);
    if (additionalGuestErrors) {
      newErrors.additionalGuests = additionalGuestErrors;
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  // Handle date selection from CustomDatePicker
  const handleDateSelect = async (name, date) => {
    let dateValue = '';
    if (date) {
      // Create a new date normalized to avoid timezone issues
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      // Use toLocaleDateString with specific format to avoid timezone issues
      const year = normalizedDate.getFullYear();
      const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
      const day = String(normalizedDate.getDate()).padStart(2, '0');
      dateValue = `${year}-${month}-${day}`;
    }
    
    // Check for time-based booking conflict on the next day
    if (name === "checkInDate" && dateValue && hasNextDayTimeBasedBookingConflict(dateValue)) {
      const tomorrow = new Date(dateValue);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDisplay = tomorrow.toLocaleDateString();
      
      toast.error("Cannot book this date", {
        description: `The next day (${tomorrowDisplay}) has a time-based booking that starts before checkout time. This date cannot be booked.`,
        duration: 6000
      });
      
      setErrors((prev) => ({
        ...prev,
        checkInDate: "Cannot book this date due to a time-based booking conflict on the next day"
      }));
      
      return; // Don't update the date selection
    }
    
    setBookingDetails((prev) => {
      const newDetails = {
        ...prev,
        [name]: dateValue,
      };
      
      // If selecting check-in date and it's between booked dates, set checkout to next day
      if (name === "checkInDate" && dateValue && isDateBetweenBookedDates(dateValue)) {
        const checkInDate = new Date(dateValue);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        
        const checkOutDateString = checkOutDate.getFullYear() + '-' + 
          String(checkOutDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(checkOutDate.getDate()).padStart(2, '0');
        
        newDetails.checkOutDate = checkOutDateString;
      }
      
      // If selecting check-in date and the next day is booked, set checkout to next day
      if (name === "checkInDate" && dateValue && isNextDayBooked(dateValue)) {
        const checkInDate = new Date(dateValue);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        
        const checkOutDateString = checkOutDate.getFullYear() + '-' + 
          String(checkOutDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(checkOutDate.getDate()).padStart(2, '0');
        
        newDetails.checkOutDate = checkOutDateString;
      }
      
      return newDetails;
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear checkout date error if check-in is between booked dates or next day is booked
    if (name === "checkInDate" && dateValue && (isDateBetweenBookedDates(dateValue) || isNextDayBooked(dateValue))) {
      setErrors((prev) => ({
        ...prev,
        checkOutDate: undefined
      }));
    }
    
    // Real-time validation for date fields
    if (name === "checkInDate" && date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        setErrors((prev) => ({
          ...prev,
          checkInDate: "Check-in date cannot be in the past"
        }));
      }
      
      // Also validate checkout if it exists and check-in is not between booked dates or next day is not booked
      if (bookingDetails.checkOutDate && !isDateBetweenBookedDates(dateValue) && !isNextDayBooked(dateValue)) {
        const checkOutDate = new Date(bookingDetails.checkOutDate);
        if (checkOutDate <= date) {
          setErrors((prev) => ({
            ...prev,
            checkOutDate: "Check-out date must be after check-in date"
          }));
        }
      }
    }
    
    if (name === "checkOutDate" && date && bookingDetails.checkInDate) {
      const checkInDate = new Date(bookingDetails.checkInDate);
      
      if (date <= checkInDate) {
        setErrors((prev) => ({
          ...prev,
          checkOutDate: "Check-out date must be after check-in date"
        }));
      }
    }
  };

  // Handle room selection change to fetch booked dates
  const handleRoomSelect = (roomNumber) => {
    // Reset the meal plan to EP - the newly selected room may not offer the
    // previously chosen plan.
    setBookingDetails(prev => ({ ...prev, roomNumber, mealPlanType: "EP" }));
    setTimeBasedDetails(prev => ({ ...prev, mealPlanType: "EP" }));

    // Find the selected room and fetch its booked dates
    const selectedRoom = availableRooms.find(room => room.roomNumber === roomNumber);
    if (selectedRoom && selectedRoom.id) {
      // Only fetch if we haven't already fetched for this room
      if (selectedRoomForDates !== selectedRoom.id) {
        fetchBookedDates(selectedRoom.id);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (paymentMethod === "BANK_TRANSFER" && !journalNumber.trim()) {
      formErrors.journalNumber = "Journal number is required for bank transfer";
    }
    if (Object.keys(formErrors).length > 0) {
      if (isTimeBasedBooking) {
        setTimeBasedErrors(formErrors);
      } else {
        setErrors(formErrors);
      }
      // Scroll to the first error field
      scrollToFirstError(formErrors);
      return;
    }

    try {
      const selectedRoom = getSelectedRoom();
      if (!selectedRoom) {
        toast.error("Selected room not found", {
          duration: 6000
        });
        return;
      }

      let payload;
      
      if (isTimeBasedBooking) {
        // 🔐 SECURITY NOTE: Admin bookings don't initiate payment, but for
        // consistency and defense-in-depth, we should still let backend
        // calculate final prices. For now keeping totalPrice for admin records.
        // Time-based booking payload
        payload = {
          ...timeBasedDetails,
          bookHour: timeBasedDetails.bookHours, // Map bookHours to bookHour for API
          roomId: selectedRoom.id,
          hotelId: hotelId,
          totalPrice: calculateTimeBasedBasePrice(), // Admin bookings don't include service tax
          // TODO: Consider removing totalPrice once backend handles admin price calculation
          // Set userId to null for all third-party bookings
          userId: null,
          adminBooking: true,
          timeBased: true,
          initiatePayment: false, // Admin bookings don't initiate payment
          discountAmount: parseFloat(discountAmount) || undefined,
          waiveWalkInServiceCharge,
          paymentMethod,
          journalNumber: paymentMethod === "BANK_TRANSFER" ? journalNumber.trim() : undefined,
        };
      } else {
        // Regular booking payload
        // Destructure bookingDetails to exclude fields not used in standard booking
        const { checkInTime, bookHour, ...standardBookingDetails } = bookingDetails;
        
        // 🔐 SECURITY NOTE: For admin bookings (no payment), keeping totalPrice
        // for record-keeping. Backend should validate/recalculate if needed.
        payload = {
          ...standardBookingDetails,
          roomId: selectedRoom.id,
          hotelId: hotelId,
          totalPrice: calculateTotalPrice(),
          // TODO: Consider removing totalPrice once backend handles admin price calculation
          days: calculateDays(),
          // Set userId to null for all third-party bookings
          userId: null,
          adminBooking: true,
          discountAmount: parseFloat(discountAmount) || undefined,
          waiveWalkInServiceCharge,
          paymentMethod,
          journalNumber: paymentMethod === "BANK_TRANSFER" ? journalNumber.trim() : undefined,
        };
      }

      const res = await api.post("/bookings", payload);
      if (res.status === 200) {
        const bookingType = isTimeBasedBooking ? "Hourly" : "Regular";
        const guestName = isTimeBasedBooking ? timeBasedDetails.guestName || "Guest" : bookingDetails.guestName;

        toast.success(`${bookingType} Booking Successful!`, {
          description: `Room ${bookingDetails.roomNumber} has been booked for ${guestName}.`,
          duration: 6000,
        });

        // Reset form based on booking type
        if (isTimeBasedBooking) {
          resetTimeBasedForm();
        } else {
          setBookingDetails({
            roomNumber: "",
            hotelId: hotelId,
            checkInDate: "",
            checkOutDate: "",
            checkInTime: "",
            bookHour: 1,
            guests: 1,
            mealPlanType: "EP",
            phone: "",
            guestName: "",
            cid: "",
            passportNumber: "",
            destination: "",
            origin: "",
            isBhutanese: true,
            additionalGuests: [],
          });
        }
        setErrors({});
        setTimeBasedErrors({});
        setDiscountAmount("");
        setWaiveWalkInServiceCharge(false);
        setPaymentMethod("CASH");
        setJournalNumber("");
        setOpenBookingDialog(false);
        
        // Only call onBookingSuccess to refresh data - avoid multiple API calls
        if (onBookingSuccess) {
          try {
            onBookingSuccess();
          } catch (error) {
            
          }
        }
      }
    } catch (error) {
      
      toast.error("Booking Failed", {
        description: "There was an error processing the booking. Please try again.",
        duration: 6000
      });
    }
  };

  const days = calculateDays();
  const totalPrice = calculateTotalPrice();
  const gstAmount = calculateGst();
  const walkInServiceChargeAmount = calculateWalkInServiceCharge();
  const appliedDiscount = calculateAppliedDiscount();
  const txnTotalPrice = calculateTxnTotalPrice();
  const selectedRoom = getSelectedRoom();

  return (
    <>
      <Button
        onClick={() => {
          if (isDisabled) {
            toast.error("Subscription expired. Please renew your subscription to create bookings.", {
              duration: 6000
            });
            return;
          }
          setOpenBookingDialog(true);
        }}
        className="w-auto cursor-pointer ml-4 sm:ml-0"
        disabled={loading || isDisabled}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {loading ? "Loading..." : "Create New Booking"}
      </Button>

      <Dialog
        open={openBookingDialog}
        onOpenChange={(open) => {
          setOpenBookingDialog(open);
          // Reset all validation errors when dialog closes
          if (!open) {
            setErrors({});
            setTimeBasedErrors({});
            setIsTimeBasedBooking(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>Book a room for a customer (registered user or walk-in guest)</DialogDescription>
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
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              {/* Loading indicator for booked dates */}
              {isLoadingBookedDates && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A 8.001 8.001 0 0 0 4.646 9.646 A 8 8 0 0 1 18 15.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-700">Loading booking calendar...</span>
                </div>
              )}

              {/* Booking Type Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className={`transition-colors ${!isTimeBasedBooking ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                  <span className="text-sm">Regular Booking</span>
                </div>
                <Switch
                  checked={isTimeBasedBooking}
                  onCheckedChange={(checked) => {
                    setIsTimeBasedBooking(checked);
                    // Clear errors when switching booking types
                    setErrors({});
                    setTimeBasedErrors({});
                  }}
                />
                <div className={`transition-colors ${isTimeBasedBooking ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                  <span className="text-sm">Hourly Booking</span>
                </div>
              </div>
              <div className="grid gap-2" data-field="roomNumber">
                <Label htmlFor="roomNumber">Room Number <span className="text-destructive">*</span></Label>
                <Select
                  value={bookingDetails.roomNumber}
                  onValueChange={handleRoomSelect}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.length > 0 ? (
                      availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.roomNumber}>
                          Room {room.roomNumber} - {room.roomTypeName} (Nu. {room.price}/night)
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No rooms available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.roomNumber && <p className="text-sm text-destructive">{errors.roomNumber}</p>}
              </div>

              {/* Time-based Booking Fields */}
              {isTimeBasedBooking && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Hourly Booking Details</h3>

                  {/* Check-in Date for Time-based Booking */}
                  <div className="grid gap-2">
                    <div data-field="checkInDate">
                      <CustomDatePicker
                        selectedDate={
                          timeBasedDetails.checkInDate ? new Date(timeBasedDetails.checkInDate + 'T12:00:00') : null
                        }
                        onDateSelect={(date) => handleTimeBasedDateSelect("checkInDate", date)}
                        blockedDates={getBlockedDatesForHourlyBooking()}
                        minDate={new Date()}
                        placeholder="Select check-in date"
                        label="Check-in Date *"
                        error={timeBasedErrors.checkInDate}
                        disabled={isLoadingBookedDates}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2" data-field="checkInTime">
                    <Label htmlFor="checkInTime" className="text-sm">
                      Check-in Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="checkInTime"
                      name="checkInTime"
                      type="time"
                      value={timeBasedDetails.checkInTime}
                      onChange={handleTimeBasedInputChange}
                      className={`h-10 text-sm ${
                        timeBasedErrors.checkInTime
                          ? "border-destructive"
                          : timeBasedDetails.checkInDate && timeBasedDetails.checkInTime && timeBasedDetails.bookHours &&
                            !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                          ? "border-red-500 bg-red-50"
                          : ""
                      }`}
                    />
                    {timeBasedErrors.checkInTime && (
                      <p className="text-sm text-destructive">{timeBasedErrors.checkInTime}</p>
                    )}
                  </div>

                  <div className="grid gap-2" data-field="bookHour">
                    <Label htmlFor="bookHour" className="text-sm">
                      Duration (Hours) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      name="bookHour"
                      value={String(timeBasedDetails.bookHours)}
                      onValueChange={handleTimeBasedBookHoursChange}
                    >
                      <SelectTrigger className={`w-full h-10 text-sm ${
                        timeBasedErrors.bookHours
                          ? "border-destructive"
                          : timeBasedDetails.checkInDate && timeBasedDetails.checkInTime && timeBasedDetails.bookHourss &&
                            !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHourss)
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
                    {timeBasedErrors.bookHours && (
                      <p className="text-sm text-destructive">{timeBasedErrors.bookHours}</p>
                    )}
                  </div>

                  {/* Existing hourly bookings for selected date */}
                  {timeBasedDetails.checkInDate && (() => {
                    const blockedTimeSlots = getBlockedTimeSlots(timeBasedDetails.checkInDate);

                    return blockedTimeSlots.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">Blocked Time Slots</p>
                            <div className="text-amber-700 mt-1 space-y-1">
                              {blockedTimeSlots.map((slot, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span>
                                    {slot.startTime} - {slot.endTime} ({slot.duration} {slot.duration === 1 ? 'hour' : 'hours'})
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    slot.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                    slot.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    slot.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {slot.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-amber-600 mt-2">
                              Please choose a different time slot to avoid conflicts with existing bookings.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hourly booking summary */}
                  {timeBasedDetails.checkInTime && timeBasedDetails.bookHours && (
                    <div className={`p-3 border rounded-lg ${
                      timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        <div className="text-sm">
                          <p className={`font-medium ${
                            timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                              ? 'text-red-800'
                              : 'text-blue-800'
                          }`}>
                            {timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                              ? 'Time Slot Conflict Detected'
                              : 'Your Hourly Booking'
                            }
                          </p>
                          <p className={`mt-1 ${
                            timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours)
                              ? 'text-red-700'
                              : 'text-blue-700'
                          }`}>
                            Check-in: {getFormattedCheckInTime()} |
                            Duration: {timeBasedDetails.bookHours} {timeBasedDetails.bookHours === 1 ? "hour" : "hours"} |
                            Check-out: {calculateCheckOutTime()}
                          </p>
                          {timeBasedDetails.checkInDate && !isTimeSlotAvailable(timeBasedDetails.checkInDate, timeBasedDetails.checkInTime, timeBasedDetails.bookHours) && (
                            <p className="text-xs text-red-600 mt-2">
                              This time slot conflicts with an existing booking. Please choose a different time or duration.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Date Selection - Only for Regular Bookings */}
              {!isTimeBasedBooking && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Select Booking Dates</h3>

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

                  {!shouldHideCheckoutDate() && (
                    <div className="grid gap-2">
                      <div data-field="checkOutDate">
                        <CustomDatePicker
                          selectedDate={bookingDetails.checkOutDate ? new Date(bookingDetails.checkOutDate + 'T12:00:00') : null}
                          onDateSelect={(date) => handleDateSelect("checkOutDate", date)}
                          blockedDates={getBlockedDates()}
                          minDate={bookingDetails.checkInDate ? new Date(new Date(bookingDetails.checkInDate).getTime() + 24 * 60 * 60 * 1000) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}
                          placeholder="Select check-out date"
                          label="Check-out Date *"
                          error={errors.checkOutDate}
                          disabled={isLoadingBookedDates}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {shouldHideCheckoutDate() && (
                    <div className="grid gap-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm">
                            <p className="font-medium text-blue-800">Single Night Stay</p>
                            <p className="text-blue-700 mt-1">
                              {`There is a booking on ${bookingDetails.checkOutDate ? new Date(bookingDetails.checkOutDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "the next day"}. Only one night is available.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Guest Information</h3>

                <div className="grid gap-2" data-field="guestName">
                  <Label htmlFor="guestName">Guest Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="guestName"
                    name="guestName"
                    type="text"
                    value={isTimeBasedBooking ? timeBasedDetails.guestName : bookingDetails.guestName}
                    onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                    placeholder="Enter guest name"
                    className="h-10"
                  />
                  {(isTimeBasedBooking ? timeBasedErrors.guestName : errors.guestName) && (
                    <p className="text-sm text-destructive">
                      {isTimeBasedBooking ? timeBasedErrors.guestName : errors.guestName}
                    </p>
                  )}
                </div>

                <div className="grid gap-2" data-field="phone">
                  <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+975</span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={isTimeBasedBooking ? timeBasedDetails.phone : bookingDetails.phone}
                      onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                      placeholder="17123456"
                      className="h-10 pl-14"
                    />
                  </div>
                  {(isTimeBasedBooking ? timeBasedErrors.phone : errors.phone) && (
                    <p className="text-sm text-destructive">
                      {isTimeBasedBooking ? timeBasedErrors.phone : errors.phone}
                    </p>
                  )}
                </div>

                {/* Nationality Selection */}
                <div className="grid gap-2">
                  <Label className="text-sm">Nationality <span className="text-destructive">*</span></Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">Bhutanese</span>
                    <Switch
                      checked={isTimeBasedBooking ? timeBasedDetails.isBhutanese : bookingDetails.isBhutanese}
                      onCheckedChange={(checked) => {
                        if (isTimeBasedBooking) {
                          handleTimeBasedNationalityChange(checked);
                        } else {
                          setBookingDetails((prev) => ({
                            ...prev,
                            isBhutanese: checked,
                            // Clear CID/passport when switching nationality
                            cid: checked ? prev.cid : "",
                            passportNumber: checked ? "" : prev.passportNumber
                          }));
                          // Clear CID/passport errors when switching nationality
                          if (errors.cid || errors.passportNumber) {
                            setErrors((prev) => ({
                              ...prev,
                              cid: undefined,
                              passportNumber: undefined
                            }));
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* CID Number - Only show for Bhutanese */}
                {(isTimeBasedBooking ? timeBasedDetails.isBhutanese : bookingDetails.isBhutanese) && (
                  <div className="grid gap-2" data-field="cid">
                    <Label htmlFor="cid" className="text-sm">CID Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="cid"
                      name="cid"
                      type="text"
                      value={isTimeBasedBooking ? timeBasedDetails.cid : bookingDetails.cid}
                      onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                      placeholder="11 digits (e.g., 10901001065)"
                      maxLength={11}
                      className={`h-10 text-sm ${(isTimeBasedBooking ? timeBasedErrors.cid : errors.cid) ? "border-destructive" : ""}`}
                    />

                    {(isTimeBasedBooking ? timeBasedErrors.cid : errors.cid) && (
                      <p className="text-sm text-destructive">
                        {isTimeBasedBooking ? timeBasedErrors.cid : errors.cid}
                      </p>
                    )}
                  </div>
                )}

                {/* Passport Number - Only show for non-Bhutanese */}
                {!(isTimeBasedBooking ? timeBasedDetails.isBhutanese : bookingDetails.isBhutanese) && (
                  <div className="grid gap-2" data-field="passportNumber">
                    <Label htmlFor="passportNumber" className="text-sm">Passport Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="passportNumber"
                      name="passportNumber"
                      type="text"
                      value={isTimeBasedBooking ? timeBasedDetails.passportNumber : bookingDetails.passportNumber}
                      onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                      placeholder="Enter passport number"
                      maxLength={20}
                      className={`h-10 text-sm ${(isTimeBasedBooking ? timeBasedErrors.passportNumber : errors.passportNumber) ? "border-destructive" : ""}`}
                    />

                    {(isTimeBasedBooking ? timeBasedErrors.passportNumber : errors.passportNumber) && (
                      <p className="text-sm text-destructive">
                        {isTimeBasedBooking ? timeBasedErrors.passportNumber : errors.passportNumber}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-2" data-field="destination">
                  <Label htmlFor="destination" className="text-sm">Destination <span className="text-destructive">*</span></Label>
                  <Input
                    id="destination"
                    name="destination"
                    type="text"
                    value={isTimeBasedBooking ? timeBasedDetails.destination : bookingDetails.destination}
                    onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                    placeholder="Enter destination"
                    className={`h-10 text-sm ${(isTimeBasedBooking ? timeBasedErrors.destination : errors.destination) ? "border-destructive" : ""}`}
                  />
                  {(isTimeBasedBooking ? timeBasedErrors.destination : errors.destination) && (
                    <p className="text-sm text-destructive">
                      {isTimeBasedBooking ? timeBasedErrors.destination : errors.destination}
                    </p>
                  )}
                </div>

                <div className="grid gap-2" data-field="origin">
                  <Label htmlFor="origin" className="text-sm">Origin <span className="text-destructive">*</span></Label>
                  <Input
                    id="origin"
                    name="origin"
                    type="text"
                    value={isTimeBasedBooking ? timeBasedDetails.origin : bookingDetails.origin}
                    onChange={isTimeBasedBooking ? handleTimeBasedInputChange : handleInputChange}
                    placeholder="Enter origin"
                    className={`h-10 text-sm ${(isTimeBasedBooking ? timeBasedErrors.origin : errors.origin) ? "border-destructive" : ""}`}
                  />
                  {(isTimeBasedBooking ? timeBasedErrors.origin : errors.origin) && (
                    <p className="text-sm text-destructive">
                      {isTimeBasedBooking ? timeBasedErrors.origin : errors.origin}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Select
                    name="guests"
                    value={String(isTimeBasedBooking ? timeBasedDetails.guests : bookingDetails.guests)}
                    onValueChange={(value) => {
                      if (isTimeBasedBooking) {
                        handleTimeBasedGuestsChange(value);
                      } else {
                        const numGuests = parseInt(value);
                        setBookingDetails(prev => ({
                          ...prev,
                          guests: numGuests,
                          additionalGuests: syncAdditionalGuests(numGuests, prev.additionalGuests),
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const maxGuests = selectedRoom?.maxGuests > 0 ? Math.min(selectedRoom.maxGuests, 6) : 6;
                        return Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} {num === 1 ? "guest" : "guests"}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  {(isTimeBasedBooking ? timeBasedErrors.guests : errors.guests) && (
                    <p className="text-sm text-destructive">
                      {isTimeBasedBooking ? timeBasedErrors.guests : errors.guests}
                    </p>
                  )}
                  {selectedRoom?.maxGuests > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Maximum {selectedRoom.maxGuests} guests allowed for this room
                    </p>
                  )}
                </div>

                {selectedRoom?.mealPlans?.length > 0 && (
                  <div className="grid gap-2" data-field="mealPlanType">
                    <Label htmlFor="mealPlanType" className="text-sm">Meal Plan</Label>
                    <Select
                      name="mealPlanType"
                      value={isTimeBasedBooking ? timeBasedDetails.mealPlanType : bookingDetails.mealPlanType}
                      onValueChange={(value) => {
                        if (isTimeBasedBooking) {
                          setTimeBasedDetails((prev) => ({ ...prev, mealPlanType: value }));
                        } else {
                          setBookingDetails((prev) => ({ ...prev, mealPlanType: value }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-10 text-sm">
                        <SelectValue placeholder="Select meal plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EP">EP — Room Only (Nu {selectedRoom.price}/night)</SelectItem>
                        {selectedRoom.mealPlans.map((mp) => (
                          <SelectItem key={mp.planType} value={mp.planType}>
                            {mp.planType} (Nu {mp.price}/night)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <AdditionalGuestFields
                  guests={isTimeBasedBooking ? timeBasedDetails.guests : bookingDetails.guests}
                  additionalGuests={
                    isTimeBasedBooking ? timeBasedDetails.additionalGuests : bookingDetails.additionalGuests
                  }
                  errors={isTimeBasedBooking ? timeBasedErrors.additionalGuests : errors.additionalGuests}
                  onGuestChange={(index, updatedGuest) => {
                    const setDetails = isTimeBasedBooking ? setTimeBasedDetails : setBookingDetails;
                    const setFormErrors = isTimeBasedBooking ? setTimeBasedErrors : setErrors;
                    const currentErrors = isTimeBasedBooking ? timeBasedErrors : errors;

                    setDetails((prev) => {
                      const next = [...prev.additionalGuests];
                      next[index] = updatedGuest;
                      return { ...prev, additionalGuests: next };
                    });
                    if (currentErrors.additionalGuests?.[index]) {
                      setFormErrors((prev) => {
                        const nextGuestErrors = [...prev.additionalGuests];
                        nextGuestErrors[index] = {};
                        return { ...prev, additionalGuests: nextGuestErrors };
                      });
                    }
                  }}
                />
              </div>

              <Separator className="my-2" />

              <div className="grid gap-3">
                <div className="grid gap-2" data-field="discountAmount">
                  <Label htmlFor="discountAmount">Discount (Nu.)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="1"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Optional flat discount for this walk-in booking.</p>
                </div>

                {hotelWalkInServiceChargeEnabled && (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">Waive Service Charge</p>
                      <p className="text-xs text-muted-foreground">Skip the hotel's service charge for this booking.</p>
                    </div>
                    <Switch
                      checked={waiveWalkInServiceCharge}
                      onCheckedChange={setWaiveWalkInServiceCharge}
                    />
                  </div>
                )}

                <div className="grid gap-2" data-field="paymentMethod">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      setPaymentMethod(value);
                      if (value !== "BANK_TRANSFER") setJournalNumber("");
                    }}
                  >
                    <SelectTrigger id="paymentMethod" className="h-10">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="grid gap-2" data-field="journalNumber">
                    <Label htmlFor="journalNumber">Journal Number</Label>
                    <Input
                      id="journalNumber"
                      type="text"
                      value={journalNumber}
                      onChange={(e) => setJournalNumber(e.target.value)}
                      placeholder="Enter bank transfer journal number"
                      className="h-10"
                    />
                    {(isTimeBasedBooking ? timeBasedErrors.journalNumber : errors.journalNumber) && (
                      <p className="text-sm text-destructive">
                        {isTimeBasedBooking ? timeBasedErrors.journalNumber : errors.journalNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {selectedRoom && (
                <div className="space-y-2 text-sm">
                  {isTimeBasedBooking ? (
                    // Time-based booking pricing
                    <>
                      {timeBasedDetails.checkInDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in Date</span>
                          <span className="font-medium">
                            {new Date(timeBasedDetails.checkInDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {timeBasedDetails.checkInTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in Time</span>
                          <span className="font-medium">
                            {getFormattedCheckInTime()}
                          </span>
                        </div>
                      )}
                      {timeBasedDetails.bookHours && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">
                            {timeBasedDetails.bookHours} {timeBasedDetails.bookHours === 1 ? "hour" : "hours"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Price</span>
                        <span className="font-medium">
                          Nu {calculateTimeBasedBasePrice().toFixed(2)}
                        </span>
                      </div>
                      {selectedRoomForHook?.gst && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GST (5%)</span>
                          <span className="font-medium">
                            Nu {calculateTimeBasedRoomGst().toFixed(2)}
                          </span>
                        </div>
                      )}
                      {calculateTimeBasedWalkInServiceCharge() > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Service Charge ({hotelWalkInServiceChargePercent}%)
                            {hotelWalkInServiceChargeInclusive && (
                              <span className="text-xs"> (incl. in room price)</span>
                            )}
                          </span>
                          <span className="font-medium">
                            Nu {calculateTimeBasedWalkInServiceCharge().toFixed(2)}
                          </span>
                        </div>
                      )}
                      {calculateTimeBasedAppliedDiscount() > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-red-600">
                            -Nu {calculateTimeBasedAppliedDiscount().toFixed(2)}
                          </span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Base Price</span>
                        <span>Nu {calculateTimeBasedBasePrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-blue-600">
                        <span>Total Payable</span>
                        <span>Nu {calculateTimeBasedTxnTotalPriceWithWalkIn().toFixed(2)}</span>
                      </div>
                      {(!timeBasedDetails.checkInDate || !timeBasedDetails.checkInTime || !timeBasedDetails.bookHours) && (
                        <p className="text-sm text-amber-600">
                          {!timeBasedDetails.checkInDate
                            ? "Please select a check-in date."
                            : !timeBasedDetails.checkInTime
                            ? "Please select a check-in time."
                            : !timeBasedDetails.bookHours
                            ? "Please select booking duration."
                            : "Please complete all required fields."
                          }
                        </p>
                      )}
                    </>
                  ) : (
                    // Regular booking pricing
                    <>
                      {bookingDetails.checkInDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in</span>
                          <span className="font-medium">
                            {new Date(bookingDetails.checkInDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {bookingDetails.checkOutDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-out</span>
                          <span className="font-medium">
                            {new Date(bookingDetails.checkOutDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Type</span>
                        <span className="font-medium">{selectedRoom.roomTypeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per night</span>
                        <span className="font-medium">Nu {selectedRoom.price.toFixed(2)}</span>
                      </div>
                      {days > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{days} {days === 1 ? "night" : "nights"}</span>
                          <span className="font-medium">Nu {totalPrice.toFixed(2)}</span>
                        </div>
                      )}
                      {days > 0 && hotelGst && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GST (5%)</span>
                          <span className="font-medium">Nu {gstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {days > 0 && walkInServiceChargeAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Service Charge ({hotelWalkInServiceChargePercent}%)
                            {hotelWalkInServiceChargeInclusive && (
                              <span className="text-xs"> (incl. in room price)</span>
                            )}
                          </span>
                          <span className="font-medium">Nu {walkInServiceChargeAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {days > 0 && appliedDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-red-600">-Nu {appliedDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Base Price</span>
                        <span>Nu {totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-blue-600">
                        <span>Total Payable</span>
                        <span>Nu {txnTotalPrice.toFixed(2)}</span>
                      </div>
                      {days === 0 && (bookingDetails.checkInDate || bookingDetails.checkOutDate) && (
                        <p className="text-sm text-amber-600">
                          {!bookingDetails.checkInDate && !bookingDetails.checkOutDate
                            ? "Please select check-in and check-out dates."
                            : !bookingDetails.checkInDate
                            ? "Please select a check-in date."
                            : "Please select a valid check-out date."
                          }
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="relative z-10">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                {isTimeBasedBooking ? "Create Hourly Booking" : "Create Booking"}
              </Button>
            </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 