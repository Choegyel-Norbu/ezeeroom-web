import { useState, useCallback } from 'react';
import { formatTimeTo12Hour } from '../utils/utils';

// Round a currency amount to exactly 2 decimal places (nearest, HALF_UP) to match
// the backend's PriceCalculationService. Never rounds up to a whole Ngultrum.
const round2 = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

/**
 * Custom hook for hourly booking functionality
 * Provides state management, validation, and calculation utilities
 */
export const useTimeBasedBooking = (room, timeBasedBookings = [], bookedDates = [], hotelCheckoutTime = "12:00") => {
  const [bookingDetails, setBookingDetails] = useState({
    checkInDate: "",
    checkInTime: "",
    bookHours: 1,
    guests: 1,
    numberOfRooms: 1,
    phone: "",
    cid: "",
    passportNumber: "",
    destination: "",
    origin: "",
    isBhutanese: true,
  });
  
  const [errors, setErrors] = useState({});

  // Helper: block morning of selected date only when previous day has no time-based bookings
  // If previous date had any time-based booking, allow morning bookings on selected date
  const hasCheckoutOnSelectedDate = useCallback((date) => {
    if (!date || bookedDates.length === 0) return false;

    const selectedDate = new Date(date);
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousDateString = previousDate.getFullYear() + '-' +
      String(previousDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(previousDate.getDate()).padStart(2, '0');

    // If previous day isn't fully booked, no checkout block
    if (!bookedDates.includes(previousDateString)) return false;

    // If previous day has any time-based bookings, allow morning on selected date
    const prevDayHourly = timeBasedBookings.filter(booking => booking.date === previousDateString);
    if (prevDayHourly && prevDayHourly.length > 0) return false;

    // Otherwise, block morning as usual (assume overnight checkout)
    return true;
  }, [bookedDates, timeBasedBookings]);

  // Helper function to check for time conflicts in hourly bookings
  const hasTimeConflict = useCallback((date, checkInTime, bookHours) => {
    if (!date || !checkInTime || !bookHours) {
      return false;
    }

    const selectedDate = new Date(date);
    const selectedDateString = selectedDate.getFullYear() + '-' + 
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selectedDate.getDate()).padStart(2, '0');

    // Calculate selected booking time range
    const [selectedHours, selectedMinutes] = checkInTime.split(':').map(Number);
    const selectedStartMinutes = selectedHours * 60 + selectedMinutes;
    const selectedEndMinutes = selectedStartMinutes + (bookHours * 60);
    
    // Check if there's a checkout on this date (previous day is booked)
    if (hasCheckoutOnSelectedDate(date)) {
      // Parse hotel checkout time
      let checkoutTimeStr = hotelCheckoutTime;
      if (checkoutTimeStr.includes(':') && checkoutTimeStr.split(':').length === 3) {
        checkoutTimeStr = checkoutTimeStr.substring(0, 5);
      }
      
      const [checkoutHours, checkoutMinutes] = checkoutTimeStr.split(':').map(Number);
      const checkoutTotalMinutes = checkoutHours * 60 + checkoutMinutes;
      
      // If the selected time starts before checkout time, it's a conflict
      if (selectedStartMinutes < checkoutTotalMinutes) {
        return { conflict: true, isCheckoutConflict: true, checkoutTime: checkoutTimeStr };
      }
    }
    
    // If no checkout conflict, check hourly bookings

    // Check against existing hourly bookings for the same date
    const conflictsWithHourly = timeBasedBookings.some(booking => {
      if (booking.date !== selectedDateString) {
        return false;
      }

      // Handle different time formats (HH:MM:SS or HH:MM)
      let existingStartTime = booking.checkInTime;
      let existingEndTime = booking.checkOutTime;
      
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
      return (selectedStartMinutes < existingEndWithBuffer && selectedEndMinutes > existingStartTotalMinutes);
    });
    
    if (conflictsWithHourly) {
      return { conflict: true, isCheckoutConflict: false };
    }
    
    return { conflict: false, isCheckoutConflict: false };
  }, [timeBasedBookings, bookedDates, hotelCheckoutTime, hasCheckoutOnSelectedDate]);

  // Calculate checkout time based on check-in time and duration
  const calculateCheckOutTime = useCallback(() => {
    if (!bookingDetails.checkInTime || !bookingDetails.bookHours) {
      return "";
    }
    
    const [hours, minutes] = bookingDetails.checkInTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (bookingDetails.bookHours * 60);
    const checkoutHours = Math.floor(totalMinutes / 60) % 24;
    const checkoutMinutes = totalMinutes % 60;
    
    const checkoutTime24 = `${checkoutHours.toString().padStart(2, '0')}:${checkoutMinutes.toString().padStart(2, '0')}`;
    return formatTimeTo12Hour(checkoutTime24);
  }, [bookingDetails.checkInTime, bookingDetails.bookHours]);

  // Format check-in time to 12-hour format
  const getFormattedCheckInTime = useCallback(() => {
    if (!bookingDetails.checkInTime) return "";
    return formatTimeTo12Hour(bookingDetails.checkInTime);
  }, [bookingDetails.checkInTime]);

  // Calculate total price for hourly booking (base price without tax)
  // Kept to exactly 2 decimal places to match the backend's price calculation.
  const calculateTotalPrice = useCallback(() => {
    if (!room?.price) return 0;
    return round2(room.price * bookingDetails.numberOfRooms);
  }, [room?.price, bookingDetails.numberOfRooms]);

  // Calculate GST amount (5% of base price), only when the hotel has GST enabled
  const calculateGst = useCallback(() => {
    if (!room?.price || !room?.gst) return 0;
    return round2(calculateTotalPrice() * 0.05);
  }, [room?.price, room?.gst, calculateTotalPrice]);

  // Calculate service tax amount (3% of base price)
  const calculateServiceTax = useCallback(() => {
    if (!room?.price) return 0;
    return round2(calculateTotalPrice() * 0.03);
  }, [room?.price, calculateTotalPrice]);

  // Calculate transaction total price (base price + service tax + GST if enabled)
  const calculateTxnTotalPrice = useCallback(() => {
    if (!room?.price) return 0;
    return round2(calculateTotalPrice() + calculateServiceTax() + calculateGst());
  }, [room?.price, calculateTotalPrice, calculateServiceTax, calculateGst]);

  // Calculate base price (before service tax) - alias for totalPrice
  const calculateBasePrice = useCallback(() => {
    return calculateTotalPrice();
  }, [calculateTotalPrice]);

  // Validate phone number (Bhutanese format)
  const validateBhutanesePhone = useCallback((phone) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (!cleanPhone) return "Phone number is required";
    if (!/^\d+$/.test(cleanPhone))
      return "Phone number should contain only digits";
    if (cleanPhone.length !== 8)
      return "Phone number must be exactly 8 digits";
    const mobilePattern = /^(16|17|77)\d{6}$/;
    if (!mobilePattern.test(cleanPhone))
      return "Invalid Bhutanese mobile number. Must start with 16, 17, or 77.";
    return null;
  }, []);

  // Validate CID Number (only required for Bhutanese citizens)
  const validateCID = useCallback((cid) => {
    if (!cid.trim()) {
      return "CID number is required for Bhutanese citizens";
    }
    
    const trimmedCid = cid.trim();
    if (!/^\d{11}$/.test(trimmedCid)) {
      return "CID must be exactly 11 digits";
    }
    
    const dzongkhagCode = parseInt(trimmedCid.substring(0, 2), 10);
    if (dzongkhagCode < 1 || dzongkhagCode > 20) {
      return "Invalid Dzongkhag code (must be 01–20)";
    }
    
    if (/^0{11}$/.test(trimmedCid)) {
      return "CID number cannot be all zeros";
    }
    
    if (/^(\d)\1{10}$/.test(trimmedCid)) {
      return "CID number cannot be all same digits";
    }

    return null;
  }, []);

  // Validate Passport Number (only required for non-Bhutanese guests)
  const validatePassportNumber = useCallback((passportNumber) => {
    if (!passportNumber.trim()) {
      return "Passport number is required for non-Bhutanese guests";
    }

    const trimmed = passportNumber.trim();
    if (!/^[A-Za-z0-9]{5,20}$/.test(trimmed)) {
      return "Passport number must be 5-20 letters/digits";
    }

    if (/^([A-Za-z0-9])\1+$/.test(trimmed)) {
      return "Passport number cannot be all the same character";
    }

    return null;
  }, []);

  // Validate destination
  const validateDestination = useCallback((destination) => {
    if (!destination.trim()) {
      return "Destination is required";
    }
    if (destination.length < 2) {
      return "Destination must be at least 2 characters long";
    }
    if (destination.length > 50) {
      return "Destination must not exceed 50 characters";
    }
    if (!/^[a-zA-Z\s\-_.,]+$/.test(destination)) {
      return "Destination can only contain letters, spaces, hyphens, underscores, commas, and periods";
    }
    return null;
  }, []);

  // Validate origin
  const validateOrigin = useCallback((origin) => {
    if (!origin.trim()) {
      return "Origin is required";
    }
    if (origin.length < 2) {
      return "Origin must be at least 2 characters long";
    }
    if (origin.length > 50) {
      return "Origin must not exceed 50 characters";
    }
    if (!/^[a-zA-Z\s\-_.,]+$/.test(origin)) {
      return "Origin can only contain letters, spaces, hyphens, underscores, commas, and periods";
    }
    return null;
  }, []);

  // Validate hourly booking form
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate CID Number (only required for Bhutanese citizens) or Passport
    // Number (only required for non-Bhutanese guests)
    if (bookingDetails.isBhutanese) {
      const cidError = validateCID(bookingDetails.cid);
      if (cidError) newErrors.cid = cidError;
    } else {
      const passportError = validatePassportNumber(bookingDetails.passportNumber);
      if (passportError) newErrors.passportNumber = passportError;
    }

    // Validate Destination
    const destinationError = validateDestination(bookingDetails.destination);
    if (destinationError) newErrors.destination = destinationError;

    // Validate Origin
    const originError = validateOrigin(bookingDetails.origin);
    if (originError) newErrors.origin = originError;

    // Validate phone number
    const phoneError = validateBhutanesePhone(bookingDetails.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    // Validate check-in date
    if (!bookingDetails.checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    } else {
      const checkInDate = new Date(bookingDetails.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        newErrors.checkInDate = "Check-in date cannot be in the past";
      } else {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (checkInDate > oneYearFromNow) {
          newErrors.checkInDate = "Check-in date cannot be more than 1 year in advance";
        }
      }
    }
    
    // Validate check-in time
    if (!bookingDetails.checkInTime) {
      newErrors.checkInTime = "Check-in time is required for hourly booking";
    } else {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(bookingDetails.checkInTime)) {
        newErrors.checkInTime = "Please enter a valid time in HH:MM format";
      }
    }

    // Validate book hours
    if (!bookingDetails.bookHours || bookingDetails.bookHours < 1) {
      newErrors.bookHours = "Booking duration must be at least 1 hour";
    } else if (bookingDetails.bookHours > 4) {
      newErrors.bookHours = "Maximum booking duration is 4 hours";
    }

    // Check for time conflicts with existing hourly bookings or checkout times
    if (bookingDetails.checkInDate && bookingDetails.checkInTime && bookingDetails.bookHours) {
      const conflict = hasTimeConflict(bookingDetails.checkInDate, bookingDetails.checkInTime, bookingDetails.bookHours);
      if (conflict.conflict) {
        if (conflict.isCheckoutConflict && conflict.checkoutTime) {
          // Format checkout time for error message
          const [hours, mins] = conflict.checkoutTime.split(':').map(Number);
          const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedTime = `${hour12}:${mins.toString().padStart(2, '0')} ${ampm}`;
          newErrors.checkInTime = `You cannot book before checkout time (${formattedTime}) on this date`;
        } else {
          newErrors.checkInTime = "This time slot conflicts with an existing hourly booking";
        }
      }
    }

    // Validate guest count
    if (!bookingDetails.guests || bookingDetails.guests < 1) {
      newErrors.guests = "Number of guests is required and must be at least 1";
    } else if (room?.maxGuests > 0 && bookingDetails.guests > room.maxGuests) {
      newErrors.guests = `Maximum ${room.maxGuests} guests allowed for this room`;
    } else if (bookingDetails.guests > 6) {
      newErrors.guests = "Maximum 6 guests allowed";
    }
    
    return newErrors;
  }, [bookingDetails, room?.maxGuests, hasTimeConflict, validateCID, validatePassportNumber, validateDestination, validateOrigin, validateBhutanesePhone, hotelCheckoutTime]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setBookingDetails((prev) => ({
      ...prev,
      [name]: name === "numberOfRooms" || name === "guests" || name === "bookHours" ? parseInt(value) : value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Handle date selection
  const handleDateSelect = useCallback((name, date) => {
    let dateValue = '';
    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      const year = normalizedDate.getFullYear();
      const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
      const day = String(normalizedDate.getDate()).padStart(2, '0');
      dateValue = `${year}-${month}-${day}`;
    }
    
    setBookingDetails((prev) => ({
      ...prev,
      [name]: dateValue,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
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
    }
  }, [errors]);

  // Handle nationality change
  const handleNationalityChange = useCallback((checked) => {
    setBookingDetails((prev) => ({
      ...prev,
      isBhutanese: checked,
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
  }, [errors.cid, errors.passportNumber]);

  // Handle guests change
  const handleGuestsChange = useCallback((value) => {
    const numGuests = parseInt(value);
    setBookingDetails((prev) => ({
      ...prev,
      guests: numGuests,
    }));
    
    // Clear error for this field
    if (errors.guests) {
      setErrors((prev) => ({
        ...prev,
        guests: undefined
      }));
    }
  }, [errors.guests]);

  // Handle book hours change
  const handleBookHoursChange = useCallback((value) => {
    const hours = parseInt(value);
    setBookingDetails((prev) => ({
      ...prev,
      bookHours: hours,
    }));
    
    // Clear error for this field
    if (errors.bookHours) {
      setErrors((prev) => ({
        ...prev,
        bookHours: undefined
      }));
    }
  }, [errors.bookHours]);

  // Reset form
  const resetForm = useCallback(() => {
    setBookingDetails({
      checkInDate: "",
      checkInTime: "",
      bookHours: 1,
      guests: 1,
      numberOfRooms: 1,
      phone: "",
      cid: "",
      passportNumber: "",
      destination: "",
      origin: "",
      isBhutanese: true,
    });
    setErrors({});
  }, []);

  // Clear specific errors
  const clearErrors = useCallback((fieldNames) => {
    if (Array.isArray(fieldNames)) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        fieldNames.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        [fieldNames]: undefined
      }));
    }
  }, []);

  // Get existing hourly bookings for a specific date
  const getExistingBookingsForDate = useCallback((date) => {
    if (!date) return [];
    
    const selectedDate = new Date(date);
    const selectedDateString = selectedDate.getFullYear() + '-' + 
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selectedDate.getDate()).padStart(2, '0');
    
    return timeBasedBookings.filter(booking => booking.date === selectedDateString);
  }, [timeBasedBookings]);

  // Get blocked time slots for a specific date (returns array of time ranges)
  const getBlockedTimeSlots = useCallback((date) => {
    if (!date) return [];
    
    const existingBookings = getExistingBookingsForDate(date);
    
    return existingBookings.map(booking => {
      // Handle different time formats (HH:MM:SS or HH:MM)
      let startTime = booking.checkInTime;
      let endTime = booking.checkOutTime;
      
      // Remove seconds if present (e.g., "19:00:00" -> "19:00")
      if (startTime.includes(':') && startTime.split(':').length === 3) {
        startTime = startTime.substring(0, 5);
      }
      if (endTime.includes(':') && endTime.split(':').length === 3) {
        endTime = endTime.substring(0, 5);
      }

      return {
        startTime: formatTimeTo12Hour(startTime),
        endTime: formatTimeTo12Hour(endTime),
        duration: booking.bookHour || booking.durationHours || 1,
        status: booking.status,
        bookingId: booking.id || booking.bookingId
      };
    });
  }, [getExistingBookingsForDate]);

  // Check if a specific time slot is available
  const isTimeSlotAvailable = useCallback((date, checkInTime, bookHours) => {
    const conflict = hasTimeConflict(date, checkInTime, bookHours);
    return !conflict.conflict;
  }, [hasTimeConflict]);

  return {
    // State
    bookingDetails,
    errors,
    
    // Actions
    setBookingDetails,
    setErrors,
    handleInputChange,
    handleDateSelect,
    handleNationalityChange,
    handleGuestsChange,
    handleBookHoursChange,
    resetForm,
    clearErrors,
    
    // Computed values
    calculateCheckOutTime,
    getFormattedCheckInTime,
    calculateTotalPrice,
    calculateTxnTotalPrice,
    calculateServiceTax,
    calculateGst,
    calculateBasePrice,
    validateForm,
    hasTimeConflict,
    getExistingBookingsForDate,
    getBlockedTimeSlots,
    isTimeSlotAvailable,
    hasCheckoutOnSelectedDate,
    
    // Validation helpers
    validateBhutanesePhone,
    validateCID,
    validatePassportNumber,
    validateDestination,
    validateOrigin,
  };
};
