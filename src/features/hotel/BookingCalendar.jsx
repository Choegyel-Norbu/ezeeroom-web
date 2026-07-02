import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Badge } from "@/shared/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import api from "../../shared/services/Api";
import { toast } from "sonner";

// Format time to 12-hour format
const formatTime = (timeString) => {
  if (!timeString) return "";

  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${hour12}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    return "";
  }
};

const BookingCalendar = ({ hotelId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [clickedPosition, setClickedPosition] = useState({ x: 0, y: 0 });
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [loadingRooms, setLoadingRooms] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

  useEffect(() => {
    const fetchRooms = async () => {
      if (!hotelId) return;

      setLoadingRooms(true);
      try {
        const response = await api.get(`/rooms/hotel/${hotelId}`);
        const roomsData = response.data || [];
        setRooms(roomsData);
      } catch (error) {
        toast.error("Failed to load rooms", { duration: 4000 });
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [hotelId]);

  useEffect(() => {
    const fetchMonthlyBookings = async () => {
      if (!hotelId) return;

      setLoading(true);
      try {
        const monthParam = currentMonth + 1;
        let apiUrl = `/bookings/search/month?year=${currentYear}&month=${monthParam}&hotelId=${hotelId}&size=1000`;

        if (selectedRoomId !== "all") {
          apiUrl += `&roomId=${selectedRoomId}`;
        }

        let response;
        try {
          response = await api.get(apiUrl);
        } catch (monthlyError) {
          let fallbackUrl = `/bookings/?hotelId=${hotelId}&size=1000`;
          if (selectedRoomId !== "all") {
            fallbackUrl += `&roomId=${selectedRoomId}`;
          }
          response = await api.get(fallbackUrl);
        }

        let allBookings = [];
        if (response.data.content) {
          allBookings = response.data.content;
        } else if (Array.isArray(response.data)) {
          allBookings = response.data;
        }

        let monthlyBookings = allBookings;
        if (response.config.url.includes('/bookings/?')) {
          monthlyBookings = allBookings.filter(booking => {
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = new Date(booking.checkOutDate);
            const monthStart = new Date(currentYear, currentMonth, 1);
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);

            return (
              (checkInDate >= monthStart && checkInDate <= monthEnd) ||
              (checkOutDate >= monthStart && checkOutDate <= monthEnd) ||
              (checkInDate < monthStart && checkOutDate > monthEnd) ||
              (checkInDate <= monthEnd && checkOutDate > monthEnd) ||
              (checkInDate < monthStart && checkOutDate >= monthStart)
            );
          });
        }

        setBookings(monthlyBookings);
      } catch (error) {
        toast.error("Failed to load booking calendar data", { duration: 6000 });
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyBookings();
  }, [hotelId, currentMonth, currentYear, daysInMonth, selectedRoomId]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const getBookingsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return bookings.filter(booking => {
      const checkInDate = booking.checkInDate;
      const checkOutDate = booking.checkOutDate;

      return dateStr === checkInDate ||
             dateStr === checkOutDate ||
             (dateStr > checkInDate && dateStr < checkOutDate);
    });
  };

  const getBookedBookingsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return bookings.filter(booking => {
      const checkInDate = booking.checkInDate;
      const checkOutDate = booking.checkOutDate;

      const isCheckInDate = dateStr === checkInDate;
      const isOngoingStay = dateStr > checkInDate && dateStr < checkOutDate;

      return isCheckInDate || isOngoingStay;
    });
  };

  const getDateStatus = (day) => {
    const dayBookings = getBookedBookingsForDate(day);

    if (dayBookings.length === 0) return "available";

    const hasConfirmed = dayBookings.some(b => b.status === "CONFIRMED");
    const hasCheckedIn = dayBookings.some(b => b.status === "CHECKED_IN");
    const hasPending = dayBookings.some(b => b.status === "PENDING");

    if (hasCheckedIn) return "checked-in";
    if (hasConfirmed) return "confirmed";
    if (hasPending) return "pending";

    return "booked";
  };

  const isFutureDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleDateClick = (day, event) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setClickedPosition({ x, y });
    } else {
      setClickedPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    setSelectedDate(dateStr);
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(parseInt(selectedDate.split('-')[2])) : [];

  const generateCalendarDays = () => {
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-[4/3] sm:aspect-square" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
      const status = getDateStatus(day);
      const isBooked = status !== "available";
      const bookingCount = getBookedBookingsForDate(day).length;

      days.push(
        <div
          key={day}
          onClick={(e) => handleDateClick(day, e)}
          className={`
            aspect-[4/3] sm:aspect-square rounded-md cursor-pointer select-none
            flex flex-col items-center justify-between pt-1.5 pb-1.5 sm:pt-2 sm:pb-2 px-1
            border transition-all duration-150 group relative overflow-hidden
            ${isBooked
              ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
              : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }
          `}
        >
          {/* Day number inside a circle */}
          <div className={`
            flex items-center justify-center rounded-full z-[1]
            w-6 h-6 sm:w-7 sm:h-7
            text-xs sm:text-sm font-semibold leading-none
            ${isToday && isBooked
              ? 'bg-green-600 text-white shadow-sm'
              : isToday
              ? 'bg-neutral-950 text-white shadow-sm'
              : isBooked
              ? 'bg-green-100 text-green-800'
              : 'bg-neutral-100 text-neutral-900'
            }
          `}>
            {day}
          </div>

          {/* Status indicator — bottom */}
          <div className="w-full flex items-center justify-center z-[1]">
            {isBooked ? (
              <span className={`
                hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide leading-none
                ${isToday ? 'text-green-800' : 'text-green-700'}
              `}>
                <span className={`w-1 h-1 rounded-full flex-shrink-0 bg-green-500`} />
                {bookingCount > 1 ? `${bookingCount} bookings` : 'Booked'}
              </span>
            ) : isToday ? (
              <span className="hidden sm:block text-[10px] font-medium text-neutral-500 leading-none">Today</span>
            ) : null}
          </div>
        </div>
      );
    }

    return days;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes dialog-expand {
          0% {
            transform: translate(-50%, -50%) scale(0) translate(calc(var(--click-x) - 50vw), calc(var(--click-y) - 50vh));
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) translate(0, 0);
            opacity: 1;
          }
        }

        @keyframes dialog-shrink {
          0% {
            transform: translate(-50%, -50%) scale(1) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0) translate(calc(var(--click-x) - 50vw), calc(var(--click-y) - 50vh));
            opacity: 0;
          }
        }

        .dialog-animate-in {
          animation: dialog-expand 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .dialog-animate-out {
          animation: dialog-shrink 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        [data-slot="dialog-close"] {
          border: none !important;
          outline: none !important;
        }

        [data-slot="dialog-close"]:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <div className="space-y-4 relative z-0">
        <Card className="shadow-none border border-neutral-200 rounded-lg overflow-hidden relative z-0">

          {/* ── Header ── */}
          <div className="px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center justify-between gap-4">
              {/* Title */}
              <div className="flex items-center gap-2">
                <Calendar className="h-[14px] w-[14px] text-neutral-500" />
                <h3 className="text-[13px] font-semibold text-neutral-950">Booking Calendar</h3>
              </div>

              {/* Month navigator */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-neutral-200 hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-950"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="px-3 min-w-[130px] text-center text-[13px] font-semibold text-neutral-950">
                  {monthNames[currentMonth]} {currentYear}
                </div>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-neutral-200 hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-950"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Room filter */}
            <div className="flex items-center gap-2 mt-3">
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
                disabled={loadingRooms}
              >
                <SelectTrigger className="h-7 w-44 text-[12px] border-neutral-200 bg-neutral-50 shadow-none">
                  <SelectValue placeholder="Filter by room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      Room {room.roomNumber} — {room.roomType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoomId !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedRoomId("all")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ── Calendar body ── */}
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-foreground" />
                <span className="text-sm text-muted-foreground">Loading calendar…</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {dayNames.map((day, i) => (
                    <div
                      key={day}
                      className="text-center py-1.5"
                    >
                      <span className="sm:hidden text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {dayNamesShort[i]}
                      </span>
                      <span className="hidden sm:inline text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {generateCalendarDays()}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 sm:gap-5 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm border border-neutral-200 bg-white" />
                    <span className="text-[11px] text-neutral-500">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm border border-green-200 bg-green-50" />
                    <span className="text-[11px] text-neutral-500">Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-neutral-950" />
                    <span className="text-[11px] text-neutral-500">Today</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Booking detail dialog ── */}
        <Dialog open={!!selectedDate} onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}>
          <DialogContent
            className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto !animate-none"
            style={{
              '--click-x': `${clickedPosition.x}px`,
              '--click-y': `${clickedPosition.y}px`,
              animation: selectedDate ? 'dialog-expand 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {selectedDateBookings.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'booking' : 'bookings'}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3">
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateBookings.map((booking, index) => {
                    const checkInDateOnly = booking.checkInDate ? booking.checkInDate.split('T')[0] : '';
                    const checkOutDateOnly = booking.checkOutDate ? booking.checkOutDate.split('T')[0] : '';

                    const isCheckInDate = checkInDateOnly === selectedDate;
                    const isCheckOutDate = checkOutDateOnly === selectedDate;
                    const isOngoingStay = selectedDate > checkInDateOnly && selectedDate < checkOutDateOnly;

                    let activityType = '';

                    return (
                      <div
                        key={booking.id || index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                            <span className="font-medium text-sm truncate text-foreground">
                              {booking.guestName || 'Guest'}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Room {booking.roomNumber}</span>
                              {activityType && (
                                <span className="text-xs text-muted-foreground">· {activityType}</span>
                              )}
                              {booking.timeBased && booking.checkInTime && booking.checkOutTime && (
                                <span className="text-xs text-primary font-medium">
                                  · {formatTime(booking.checkInTime)} – {formatTime(booking.checkOutTime)}
                                </span>
                              )}
                              <Badge
                                variant={booking.timeBased ? 'secondary' : 'outline'}
                                className="text-[10px] font-medium hidden lg:inline-flex"
                              >
                                {booking.timeBased ? 'hourly' : 'standard'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            booking.status === 'CHECKED_IN' ? 'default' :
                            booking.status === 'CONFIRMED' ? 'secondary' :
                            booking.status === 'PENDING' ? 'outline' : 'destructive'
                          }
                          className="text-xs ml-2 flex-shrink-0"
                        >
                          {booking.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Calendar className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No bookings for this date</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default BookingCalendar;
