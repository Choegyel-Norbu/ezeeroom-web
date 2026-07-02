/**
 * Booking availability rules — single source of truth for the BOOKING CARD UX.
 *
 * ⚠️  These are CLIENT-SIDE rules for what the calendar shows/blocks. They do NOT
 *     enforce anything — the backend (UnifiedBookingServiceImpl) is authoritative
 *     and re-checks every conflict with a pessimistic lock before any booking is
 *     created. Keep these rules in sync with the backend so the UI doesn't promise
 *     something the server will reject (or vice-versa).
 *
 * THE TWO BOOKING MODELS
 * ----------------------
 *   STANDARD (regular / overnight)   spans nights.   check-in afternoon → check-out next morning.
 *   TIME-BASED (hourly)              lives in ONE day. has checkInTime + checkOutTime + bookHour.
 *
 * The two models share the same physical room, so they can conflict with each other.
 * A "morning" hourly booking (before 12:00) and an "afternoon" one (>= 12:00) behave
 * differently toward an overnight stay — that asymmetry is the source of most of the
 * rules below.
 */

const NOON_MINUTES = 12 * 60;

// ── small shared helpers ─────────────────────────────────────────────────────

/** Format a Date as a local "YYYY-MM-DD" string (NOT UTC — avoids off-by-one). */
export const toDateStr = (date) =>
  date.getFullYear() + '-' +
  String(date.getMonth() + 1).padStart(2, '0') + '-' +
  String(date.getDate()).padStart(2, '0');

/** Return a new Date offset by `n` days from `date`. */
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** Normalize "HH:MM:SS" or "HH:MM" → "HH:MM". Returns null for falsy input. */
const normalizeTime = (timeStr) => {
  if (!timeStr) return null;
  return timeStr.split(':').length === 3 ? timeStr.substring(0, 5) : timeStr;
};

/** Convert a time string to minutes-since-midnight. Returns null for falsy input. */
const toMinutes = (timeStr) => {
  const t = normalizeTime(timeStr);
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// ── time-based booking classification ────────────────────────────────────────

/** A time-based booking starting at/after 12:00 noon. Conflicts with an overnight stay. */
export const isAfternoonTimeBasedBooking = (booking) => {
  const mins = toMinutes(booking.checkInTime);
  return mins !== null && mins >= NOON_MINUTES;
};

/** A time-based booking starting before 12:00 noon. Conflicts with the PREVIOUS night's checkout. */
export const isMorningTimeBasedBooking = (booking) => {
  const mins = toMinutes(booking.checkInTime);
  return mins !== null && mins < NOON_MINUTES;
};

// ── standard (overnight) helpers ─────────────────────────────────────────────

/**
 * Is `dateString` sandwiched between two booked nights (prev day booked AND next day booked)?
 * Such a date can only ever be a single-night stay.
 */
export const isDateBetweenBookedDates = (dateString, bookedDates) => {
  if (!dateString || !bookedDates.length) return false;
  const selected = new Date(dateString);
  const prevBooked = bookedDates.includes(toDateStr(addDays(selected, -1)));
  const nextBooked = bookedDates.includes(toDateStr(addDays(selected, 1)));
  return prevBooked && nextBooked;
};

/** Is the night immediately after `checkInDateString` already booked (regular)? */
export const isNextDayBooked = (checkInDateString, bookedDates) => {
  if (!checkInDateString || !bookedDates.length) return false;
  return bookedDates.includes(toDateStr(addDays(new Date(checkInDateString), 1)));
};

/**
 * Does tomorrow have a time-based booking that starts at/before the hotel checkout time?
 * If so, an overnight guest checking in tonight couldn't check out in time → conflict.
 */
export const hasNextDayTimeBasedBookingConflict = (checkInDateString, timeBasedBookings, hotel) => {
  if (!checkInDateString || !timeBasedBookings.length || !hotel?.checkoutTime) return false;

  const tomorrowStr = toDateStr(addDays(new Date(checkInDateString), 1));
  const tomorrowBookings = timeBasedBookings.filter((b) => b.date === tomorrowStr);
  if (tomorrowBookings.length === 0) return false;

  const checkoutMinutes = toMinutes(hotel.checkoutTime);
  return tomorrowBookings.some((b) => {
    const start = toMinutes(b.checkInTime);
    return start !== null && start <= checkoutMinutes;
  });
};

// ── time-based (hourly) conflict ─────────────────────────────────────────────

/**
 * Does the proposed hourly slot overlap an existing hourly booking on the same date?
 * A 1-hour turnover buffer is added AFTER each existing booking.
 *
 * ⚠️  The backend does NOT currently apply this buffer (findTimeBasedConflictingBookingsForUpdate
 *     uses a strict overlap). If you change one, change both — otherwise the UI and the
 *     server will disagree about which slots are bookable.
 */
export const hasTimeConflict = (date, checkInTime, bookHours, timeBasedBookings) => {
  if (!date || !checkInTime || !bookHours || !timeBasedBookings.length) return false;

  const dateStr = toDateStr(new Date(date));
  const start = toMinutes(checkInTime);
  const end = start + bookHours * 60;

  return timeBasedBookings.some((b) => {
    if (b.date !== dateStr) return false;
    const existingStart = toMinutes(b.checkInTime);
    const existingEnd = toMinutes(b.checkOutTime) + 60; // +60 min turnover buffer
    return start < existingEnd && end > existingStart;
  });
};

// ── the master "what dates are blocked for STANDARD booking" rule ────────────

/**
 * Dates the guest may NOT start (or pass through) a STANDARD overnight booking on.
 *
 * A date is blocked when ANY of these hold:
 *   1. It has a regular booking and NO time-based booking (fully taken overnight).
 *   2. It has BOTH a regular and a time-based booking (fully taken).
 *   3. It has ONLY an afternoon (>= 12:00) time-based booking — overlaps the overnight stay.
 *   4. TOMORROW has a time-based booking starting at/before checkout → can't check out in time.
 *   5. TOMORROW has a morning (< 12:00) time-based booking → checkout next morning would clash.
 *
 * Dates with ONLY a morning time-based booking are deliberately NOT blocked here — a
 * morning hourly guest is gone before an overnight check-in, so the night is still sellable.
 */
export const getBlockedDates = (bookedDates, timeBasedBookings, hotel) => {
  const allTimeBasedDates = timeBasedBookings.map((b) => b.date);
  const afternoonDates = timeBasedBookings.filter(isAfternoonTimeBasedBooking).map((b) => b.date);

  // (1) regular bookings with no overlapping hourly booking
  const regularOnly = bookedDates.filter((d) => !allTimeBasedDates.includes(d));
  // (2) both regular + hourly on the same date
  const bothBookings = bookedDates.filter((d) => allTimeBasedDates.includes(d));
  // (3) afternoon-only hourly (no regular booking that day)
  const afternoonOnly = afternoonDates.filter((d) => !bookedDates.includes(d));

  // (4) block the night BEFORE any hourly booking that starts at/before checkout time
  const nextDayConflict = new Set();
  if (hotel?.checkoutTime) {
    const checkoutMinutes = toMinutes(hotel.checkoutTime);
    timeBasedBookings.forEach((b) => {
      if (!b.date) return;
      const start = toMinutes(b.checkInTime);
      if (start !== null && start <= checkoutMinutes) {
        nextDayConflict.add(toDateStr(addDays(new Date(b.date), -1)));
      }
    });
  }

  // (5) block the night BEFORE any morning hourly booking (checkout-morning clash)
  const morningConflict = new Set();
  timeBasedBookings.forEach((b) => {
    if (b.date && isMorningTimeBasedBooking(b)) {
      morningConflict.add(toDateStr(addDays(new Date(b.date), -1)));
    }
  });

  return [
    ...new Set([
      ...regularOnly,
      ...bothBookings,
      ...afternoonOnly,
      ...nextDayConflict,
      ...morningConflict,
    ]),
  ];
};

// ── extension (extend an existing STANDARD stay) ─────────────────────────────

/**
 * Limit for extending a STANDARD booking's checkout.
 *
 * Because checkout is EXCLUSIVE, extending claims the nights [currentCheckOut, newCheckOut).
 * The FIRST night claimed is the current checkout date itself. A night is "occupied" if
 * any other booking holds it — a regular booking night, OR any time-based booking on that
 * date (an extending guest is continuously in the room, so even a morning hourly booking
 * that day clashes).
 *
 * The current booking never blocks itself: its own nights are all strictly before
 * currentCheckOut (exclusive checkout), so they fall outside the claimed range.
 *
 * ⚠️  Mirror of the backend findConflictingBookingsForExtension query — keep in sync.
 * NOTE: does not special-case a morning time-based booking ON the new-checkout day
 *       (the room is held until hotel checkout time). Tracked as a known gap, same class
 *       as the morning-conflict gap in getBlockedDates.
 *
 * @returns {{ canExtend: boolean, maxCheckOut: string|null }}
 *   canExtend  – false when the current checkout night is already taken (no extension possible).
 *   maxCheckOut– latest checkout date (YYYY-MM-DD) the guest may pick; null = unbounded.
 *                The guest may check OUT on this date but not stay past it.
 */
export const getExtensionLimit = (currentCheckOut, bookedDates, timeBasedBookings) => {
  const start = toDateStr(new Date(currentCheckOut));
  const occupied = [...bookedDates, ...timeBasedBookings.map((b) => b.date)]
    .filter((d) => d >= start)
    .sort();
  const boundary = occupied.length ? occupied[0] : null;
  return {
    canExtend: boundary !== start, // current checkout night must be free
    maxCheckOut: boundary,
  };
};

/**
 * Does extending checkout from `currentCheckOut` to `newCheckOut` hit an occupied night?
 * Same rule as getExtensionLimit, for validating a specific chosen date.
 */
export const extensionHasConflict = (currentCheckOut, newCheckOut, bookedDates, timeBasedBookings) => {
  const start = toDateStr(new Date(currentCheckOut));
  const end = toDateStr(new Date(newCheckOut));
  const occupiedInRange = (d) => d >= start && d < end;
  return (
    bookedDates.some(occupiedInRange) ||
    timeBasedBookings.some((b) => occupiedInRange(b.date))
  );
};

/**
 * Can an overnight booking START today (for the "Book Tonight" button)?
 * Today is unavailable if it's already booked, has an afternoon hourly booking,
 * or tomorrow has an hourly booking that would block checkout.
 */
export const computeTodayAvailability = (bookedDates, timeBasedBookings, hotel, today = new Date()) => {
  const todayStr = toDateStr(today);

  if (bookedDates.includes(todayStr)) return false;

  const todayBookings = timeBasedBookings.filter((b) => b.date === todayStr);
  if (todayBookings.some(isAfternoonTimeBasedBooking)) return false;

  if (hasNextDayTimeBasedBookingConflict(todayStr, timeBasedBookings, hotel)) return false;

  return true;
};
