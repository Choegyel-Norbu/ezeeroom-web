import React, { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/popover";
import { Calendar as CalendarComponent } from "@/shared/components/calendar";
import { cn } from "@/shared/utils";
import { format } from "date-fns";
import api from "../../shared/services/Api";

/**
 * AvailabilityDatePicker - A custom date picker that fetches room availability
 * and blocks unavailable dates from being selected.
 * 
 * This component calls the API endpoint `/rooms/{roomId}/availability/month/{yearMonth}`
 * to get room availability data and visually blocks unavailable dates in the calendar.
 * 
 * Features:
 * - Fetches availability data when calendar opens
 * - Blocks unavailable dates from selection
 * - Shows loading states and error handling
 * - Provides refresh functionality
 * - Supports different variants (default/immediate)
 * - Handles API fallbacks gracefully
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.roomId - The ID of the room to check availability for
 * @param {string|number} props.hotelId - The ID of the hotel
 * @param {Date|null} props.selectedDate - Currently selected date
 * @param {Function} props.onDateSelect - Callback when a date is selected
 * @param {string} [props.placeholder="Pick a date"] - Placeholder text
 * @param {boolean} [props.disabled=false] - Whether the picker is disabled
 * @param {Date} [props.minDate=new Date()] - Minimum selectable date
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant="default"] - Variant type: "default" or "immediate"
 * 
 * @example
 * // Basic usage
 * <AvailabilityDatePicker
 *   roomId="123"
 *   hotelId="456"
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 * />
 * 
 * // Immediate booking variant
 * <AvailabilityDatePicker
 *   roomId="123"
 *   hotelId="456"
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 *   variant="immediate"
 *   minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
 * />
 */
export default function AvailabilityDatePicker({
  roomId,
  hotelId,
  selectedDate,
  onDateSelect,
  placeholder = "Pick a date",
  disabled = false,
  minDate = new Date(),
  className,
  variant = "default", // "default" or "immediate"
}) {
  // Validate required props
  if (!roomId || !hotelId) {
    
    return (
      <Button
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", className)}
        disabled={true}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Invalid configuration
      </Button>
    );
  }
  const [isOpen, setIsOpen] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch room availability for the current month
  const fetchRoomAvailability = useCallback(async (date) => {
    if (!roomId || !hotelId) return;

    try {
      setLoading(true);
      setError(null);

      // Format date as YYYY-MM for the API
      const yearMonth = format(date, "yyyy-MM");
      
      // Call the availability API endpoint
      try {
        const response = await api.get(`/rooms/${roomId}/availability/month/${yearMonth}`);
        
        if (response.status === 200 && response.data) {
          // Process the availability data to get unavailable dates
          const unavailable = processAvailabilityData(response.data, date);
          setUnavailableDates(unavailable);
        }
      } catch (apiError) {
        // If the specific endpoint doesn't exist, try to get bookings data as fallback
        if (apiError.response?.status === 404) {
          try {
            // Fallback: try to get room bookings for the month
            const fallbackResponse = await api.get(`/rooms/${roomId}/bookings/month/${yearMonth}`);
            if (fallbackResponse.status === 200 && fallbackResponse.data) {
              const unavailable = processAvailabilityData(fallbackResponse.data, date);
              setUnavailableDates(unavailable);
            }
          } catch (fallbackError) {
            setUnavailableDates([]);
          }
        } else {
          throw apiError; // Re-throw if it's not a 404 error
        }
      }
    } catch (err) {
      
      setError("Failed to load availability data");
      // Don't block the user if availability check fails
      setUnavailableDates([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, hotelId]);

  // Process availability data to get unavailable date ranges
  const processAvailabilityData = (availabilityData, currentMonth) => {
    const unavailable = [];
    
    try {
      // Handle different response formats
      if (Array.isArray(availabilityData)) {
        // If it's an array of bookings
        availabilityData.forEach(booking => {
          if (booking.checkInDate && booking.checkOutDate) {
            const start = new Date(booking.checkInDate);
            const end = new Date(booking.checkOutDate);
            
            // Add all dates in the range to unavailable dates
            const current = new Date(start);
            while (current < end) {
              unavailable.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          }
        });
      } else if (availabilityData.bookings && Array.isArray(availabilityData.bookings)) {
        // If it's an object with bookings array
        availabilityData.bookings.forEach(booking => {
          if (booking.checkInDate && booking.checkOutDate) {
            const start = new Date(booking.checkInDate);
            const end = new Date(booking.checkOutDate);
            
            const current = new Date(start);
            while (current < end) {
              unavailable.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          }
        });
      } else if (availabilityData.unavailableDates && Array.isArray(availabilityData.unavailableDates)) {
        // If it's already in the correct format
        availabilityData.unavailableDates.forEach(dateStr => {
          unavailable.push(new Date(dateStr));
        });
      }
    } catch (err) {
      
    }
    
    return unavailable;
  };

  // Check if a date is unavailable
  const isDateUnavailable = (date) => {
    if (!date || unavailableDates.length === 0) return false;
    
    // For immediate booking, block today and past dates
    if (variant === "immediate") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
    }
    
    // Check if date is in unavailable dates
    return unavailableDates.some(unavailableDate => {
      const unavailable = new Date(unavailableDate);
      unavailable.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return unavailable.getTime() === checkDate.getTime();
    });
  };

  // Get tooltip text for unavailable dates
  const getDateTooltip = (date) => {
    if (variant === "immediate" && date < new Date()) {
      return "Cannot select past dates";
    }
    
    if (isDateUnavailable(date)) {
      return "This date is already booked";
    }
    
    return "Available for booking";
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (date && !isDateUnavailable(date)) {
      onDateSelect(date);
      setIsOpen(false);
    }
  };

  // Handle popover open/close
  const handleOpenChange = (open) => {
    setIsOpen(open);
    
    // Fetch availability when opening the calendar
    if (open && !loading && unavailableDates.length === 0) {
      const dateToCheck = selectedDate || new Date();
      fetchRoomAvailability(dateToCheck);
    }
  };

  // Fetch availability when month changes in calendar
  const handleMonthChange = (date) => {
    if (date && roomId && hotelId) {
      fetchRoomAvailability(date);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Select Date</span>
              {unavailableDates.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unavailableDates.length} date{unavailableDates.length !== 1 ? 's' : ''} unavailable
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const dateToCheck = selectedDate || new Date();
                fetchRoomAvailability(dateToCheck);
              }}
              disabled={loading}
              className="h-6 w-6 p-0"
              title="Refresh availability data"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => isDateUnavailable(date)}
          initialFocus
          onMonthChange={handleMonthChange}
          fromDate={minDate}
          className="rounded-md border-0"
          components={{
            Day: ({ date, ...props }) => {
              const isUnavailable = isDateUnavailable(date);
              const tooltip = getDateTooltip(date);
              
              return (
                <div
                  className={cn(
                    "relative w-full h-full flex items-center justify-center",
                    isUnavailable && "cursor-not-allowed opacity-50"
                  )}
                  title={tooltip}
                >
                  <div
                    {...props}
                    className={cn(
                      props.className,
                      isUnavailable && "bg-destructive/20 text-destructive/70 hover:bg-destructive/30"
                    )}
                  />
                </div>
              );
            }
          }}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="p-3 text-center text-sm text-muted-foreground border-t">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              Loading availability...
            </div>
          </div>
        )}
        
        {/* Error message with retry button */}
        {error && (
          <div className="p-3 text-center text-sm border-t">
            <p className="text-destructive mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dateToCheck = selectedDate || new Date();
                fetchRoomAvailability(dateToCheck);
              }}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Legend */}
        <div className="p-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-muted rounded-sm"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-destructive/20 rounded-sm border border-destructive/30"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/20 rounded-sm border border-primary/30"></div>
            <span>Selected</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
