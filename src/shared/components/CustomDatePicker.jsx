import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

/**
 * CustomDatePicker - A reusable date picker component for Ezeeroom
 * 
 * Features:
 * - Blocked dates support for room availability
 * - Minimum date restriction
 * - Clean, accessible UI with keyboard support
 * - Responsive design with Tailwind CSS
 * - Proper date validation and formatting
 */
const CustomDatePicker = ({ 
  selectedDate, 
  onDateSelect, 
  blockedDates = [], 
  timeBasedBookings = [],
  minDate = null,
  maxDate = null,
  placeholder = "Select a date",
  className = "",
  disabled = false,
  label = "",
  error = "",
  showLegend = true,
  dateFormat = 'en-US'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Feedback shown when the user clicks a date that cannot be selected (blocked / out of range).
  const [unavailableHint, setUnavailableHint] = useState('');
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );

  // Constants
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /**
   * Date utility functions
   */
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  /**
   * Date validation functions
   */
  const isDateBlocked = (date) => {
    const dateStr = date.toDateString();
    return blockedDates.some(blockedDate => {
      const blocked = new Date(blockedDate);
      return blocked.toDateString() === dateStr;
    });
  };

  const isDateBeforeMin = (date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(12, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    return checkDate < min;
  };

  const isDateAfterMax = (date) => {
    if (!maxDate) return false;
    const max = new Date(maxDate);
    max.setHours(12, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    return checkDate > max;
  };

  const hasTimeBasedBookingOnDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return timeBasedBookings.some(booking => booking.date === dateString);
  };

  const isDateAfterTimeBasedBooking = (date) => {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayString = `${previousDay.getFullYear()}-${String(previousDay.getMonth() + 1).padStart(2, '0')}-${String(previousDay.getDate()).padStart(2, '0')}`;
    
    return timeBasedBookings.some(booking => booking.date === previousDayString);
  };

  const isDateSelectable = (date) => {
    return !isDateBlocked(date) && !isDateBeforeMin(date) && !isDateAfterMax(date);
  };

  /**
   * Generate calendar days for current month view
   */
  const generateCalendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth, currentYear]);

  /**
   * Handle date selection
   */
  const handleDateClick = (day) => {
    if (disabled) return;

    // Create date at noon to avoid timezone issues
    const date = new Date(currentYear, currentMonth, day, 12, 0, 0, 0);

    if (isDateSelectable(date)) {
      setUnavailableHint('');
      onDateSelect(date);
      setIsOpen(false);
    } else {
      // Give the user an explicit reason instead of silently ignoring the click.
      if (isDateBlocked(date)) {
        setUnavailableHint('This date is already booked and cannot be selected.');
      } else if (isDateBeforeMin(date)) {
        setUnavailableHint('This date is too early to book.');
      } else if (isDateAfterMax(date)) {
        setUnavailableHint('This date is too far in advance to book.');
      } else {
        setUnavailableHint('This date is unavailable.');
      }
    }
  };

  /**
   * Navigate between months
   */
  const navigateMonth = (direction) => {
    if (disabled) return;

    setUnavailableHint('');

    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(dateFormat, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Check if date is currently selected
   */
  const isDateSelected = (day) => {
    if (!selectedDate) return false;
    // Create date at noon to avoid timezone issues
    const date = new Date(currentYear, currentMonth, day, 12, 0, 0, 0);
    // Normalize selected date to avoid timezone issues
    const normalizedSelectedDate = new Date(selectedDate);
    normalizedSelectedDate.setHours(12, 0, 0, 0);
    
    return normalizedSelectedDate.getFullYear() === date.getFullYear() &&
           normalizedSelectedDate.getMonth() === date.getMonth() &&
           normalizedSelectedDate.getDate() === date.getDate();
  };

  /**
   * Handle clear date selection
   */
  const handleClearDate = (e) => {
    e.stopPropagation();
    if (!disabled) {
      onDateSelect(null);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  /**
   * Close picker when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.date-picker-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Update current month/year when selectedDate changes
   */
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  /**
   * Parse label to make asterisks red
   */
  const renderLabel = () => {
    if (!label) return null;
    
    // Split label by asterisk and wrap asterisks in red span
    const parts = label.split(/(\*)/g);
    return (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {parts.map((part, index) => 
          part === '*' ? (
            <span key={index} className="text-destructive">*</span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </label>
    );
  };

  return (
    <div className={`date-picker-container relative ${className}`}>
      {/* Label */}
      {renderLabel()}

      {/* Input Field */}
      <div 
        className={`
          flex items-center justify-between h-10 px-3 border rounded-lg cursor-pointer transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
            : 'bg-transparent hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200'
          }
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
        onClick={() => { if (!disabled) { setUnavailableHint(''); setIsOpen(!isOpen); } }}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Date picker, ${selectedDate ? `selected date is ${formatDate(selectedDate)}` : 'no date selected'}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="flex items-center space-x-2">
          <Calendar className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={
            selectedDate 
              ? (disabled ? "text-gray-500" : "text-gray-900") 
              : (disabled ? "text-gray-400" : "text-gray-500/50")
          }>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>
        </div>
        {selectedDate && !disabled && (
          <button
            onClick={handleClearDate}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 rounded"
            aria-label="Clear selected date"
            tabIndex={0}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div 
          className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80"
          role="dialog"
          aria-label="Calendar"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Previous month"
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900" aria-live="polite">
              {months[currentMonth]} {currentYear}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Next month"
              type="button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2" role="row">
            {daysOfWeek.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500" role="columnheader">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1" role="grid">
            {generateCalendarDays.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2" role="gridcell"></div>;
              }

              // Create date at noon to avoid timezone issues
              const date = new Date(currentYear, currentMonth, day, 12, 0, 0, 0);
              const isBlocked = isDateBlocked(date);
              const isBeforeMin = isDateBeforeMin(date);
              const isAfterMax = isDateAfterMax(date);
              const isSelectable = isDateSelectable(date);
              const isSelected = isDateSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  aria-disabled={!isSelectable}
                  className={`
                    p-2 text-sm rounded transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-200
                    ${isSelected
                      ? 'bg-blue-500 text-white font-semibold'
                      : isSelectable
                        ? 'hover:bg-blue-100 text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }
                    ${isBlocked ? 'bg-red-100 text-red-500 line-through' : ''}
                    ${(isBeforeMin || isAfterMax) && !isBlocked ? 'bg-gray-100 text-gray-400' : ''}
                  `}
                  title={
                    isBlocked ? 'This date is blocked' :
                    isBeforeMin ? 'Date is before minimum allowed date' :
                    isAfterMax ? 'Date is after maximum allowed date' :
                    'Click to select'
                  }
                  aria-label={`${day} ${months[currentMonth]} ${currentYear}${isSelected ? ', selected' : ''}${!isSelectable ? ', unavailable' : ''}`}
                  role="gridcell"
                  type="button"
                >
                  {day}
                  {isBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <X className="w-3 h-3 text-red-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Inline feedback when an unavailable date is clicked */}
          {unavailableHint && (
            <p className="mt-3 text-xs text-red-600" role="status" aria-live="polite">
              {unavailableHint}
            </p>
          )}

          {/* Legend */}
          {showLegend && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-100 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// PropTypes for type safety and better developer experience
CustomDatePicker.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  onDateSelect: PropTypes.func.isRequired,
  blockedDates: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])),
  timeBasedBookings: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    checkInTime: PropTypes.string,
    checkOutTime: PropTypes.string,
    bookHour: PropTypes.number,
    status: PropTypes.string
  })),
  minDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  maxDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  error: PropTypes.string,
  showLegend: PropTypes.bool,
  dateFormat: PropTypes.string
};

export default CustomDatePicker;
