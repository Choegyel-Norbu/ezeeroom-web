import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';

/**
 * Custom TimePicker Component
 * 
 * A cross-browser compatible time picker that provides a consistent UI
 * across all browsers and devices. Uses a popover interface with
 * separate hour and minute selectors.
 * 
 * Features:
 * - 12/24 hour format support
 * - Keyboard navigation
 * - Touch-friendly interface
 * - Consistent styling across browsers
 * - Accessibility support
 */
const TimePicker = ({
  value = '',
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className = '',
  format24h = true,
  error = false,
  id,
  name,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [displayValue, setDisplayValue] = useState('');
  
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const periodScrollRef = useRef(null);

  // Generate hour options based on format
  const hours = format24h 
    ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    : Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Generate minute options (all 60 minutes for precise selection)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // AM/PM periods
  const periods = ['AM', 'PM'];

  // Parse incoming value and set internal state
  useEffect(() => {
    if (value) {
      const [hourPart, minutePart] = value.split(':');
      
      if (format24h) {
        setSelectedHour(hourPart || '');
        setSelectedMinute(minutePart || '');
        setDisplayValue(value);
      } else {
        // Convert 24h to 12h format
        let hour = parseInt(hourPart || '0');
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        
        setSelectedHour(hour.toString().padStart(2, '0'));
        setSelectedMinute(minutePart || '');
        setSelectedPeriod(period);
        
        const displayHour = hour.toString().padStart(2, '0');
        setDisplayValue(`${displayHour}:${minutePart || '00'} ${period}`);
      }
    } else {
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('AM');
      setDisplayValue('');
    }
  }, [value, format24h]);

  // Handle time selection
  const handleTimeSelect = (hour, minute, period = null) => {
    let finalHour = hour;
    let finalMinute = minute;
    let finalPeriod = period || selectedPeriod;

    if (!format24h && period) {
      // Convert 12h to 24h format for the value
      let hour24 = parseInt(hour);
      if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      } else if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      }
      finalHour = hour24.toString().padStart(2, '0');
    }

    const timeValue = `${finalHour}:${finalMinute}`;
    
    // Update display value
    if (format24h) {
      setDisplayValue(timeValue);
    } else {
      const displayHour = hour.padStart(2, '0');
      setDisplayValue(`${displayHour}:${finalMinute} ${finalPeriod}`);
    }

    // Call onChange with 24h format value
    if (onChange) {
      const event = {
        target: {
          name: name,
          value: timeValue
        }
      };
      onChange(event);
    }
  };

  // Handle hour selection
  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    if (selectedMinute) {
      handleTimeSelect(hour, selectedMinute, selectedPeriod);
    }
  };

  // Handle minute selection
  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    if (selectedHour) {
      handleTimeSelect(selectedHour, minute, selectedPeriod);
    }
  };

  // Handle period selection (AM/PM)
  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    if (selectedHour && selectedMinute) {
      handleTimeSelect(selectedHour, selectedMinute, period);
    }
  };

  // Scroll to selected item
  const scrollToSelected = (ref, value, items) => {
    if (ref.current && value) {
      const index = items.indexOf(value);
      if (index !== -1) {
        const itemHeight = 40; // Height of each item
        ref.current.scrollTop = index * itemHeight;
      }
    }
  };

  // Scroll to selected items when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected(hourScrollRef, selectedHour, hours);
        scrollToSelected(minuteScrollRef, selectedMinute, minutes);
        if (!format24h) {
          scrollToSelected(periodScrollRef, selectedPeriod, ['AM', 'PM']);
        }
      }, 100);
    }
  }, [isOpen, selectedHour, selectedMinute, selectedPeriod, hours, minutes, format24h]);

  // Handle keyboard input for direct time entry
  const handleDirectInput = (e) => {
    const inputValue = e.target.value;
    
    if (format24h) {
      // 24-hour format validation
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputValue)) {
        const [hour, minute] = inputValue.split(':');
        setSelectedHour(hour.padStart(2, '0'));
        setSelectedMinute(minute);
        setDisplayValue(inputValue);
        
        if (onChange) {
          const event = {
            target: {
              name: name,
              value: inputValue
            }
          };
          onChange(event);
        }
      }
    } else {
      // 12-hour format validation (supports both "HH:MM AM/PM" and "HH:MM")
      const time12hPattern = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)?$/i;
      const match = inputValue.match(time12hPattern);
      
      if (match) {
        let [, hour, minute, period] = match;
        period = period ? period.toUpperCase() : selectedPeriod;
        
        setSelectedHour(hour.padStart(2, '0'));
        setSelectedMinute(minute);
        setSelectedPeriod(period);
        
        const displayTime = `${hour.padStart(2, '0')}:${minute} ${period}`;
        setDisplayValue(displayTime);
        
        // Convert to 24h for the value
        let hour24 = parseInt(hour);
        if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        } else if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        }
        
        if (onChange) {
          const event = {
            target: {
              name: name,
              value: `${hour24.toString().padStart(2, '0')}:${minute}`
            }
          };
          onChange(event);
        }
      }
    }
  };

  const TimeColumn = ({ items, selectedValue, onSelect, scrollRef, label, isPeriod = false }) => (
    <div className="flex flex-col">
      <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
        {label}
      </div>
      <div 
        ref={scrollRef}
        className={cn(
          "overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          isPeriod ? "h-20" : "h-40"
        )}
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "w-full h-10 flex items-center justify-center text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-sm border border-transparent",
              selectedValue === item && "bg-primary text-primary-foreground font-medium border-primary shadow-sm",
              isPeriod && "font-semibold text-base"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            error && "border-destructive",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
          {...props}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Direct input field */}
          <div className="mb-4">
            <Input
              placeholder={format24h ? "HH:MM (24h)" : "HH:MM AM/PM"}
              value={displayValue}
              onChange={handleDirectInput}
              className="text-center font-mono"
            />
          </div>
          
          {/* Time selectors */}
          <div className={cn(
            "grid gap-4",
            format24h ? "grid-cols-2" : "grid-cols-3"
          )}>
            <TimeColumn
              items={hours}
              selectedValue={selectedHour}
              onSelect={handleHourSelect}
              scrollRef={hourScrollRef}
              label="Hour"
            />
            
            <TimeColumn
              items={minutes}
              selectedValue={selectedMinute}
              onSelect={handleMinuteSelect}
              scrollRef={minuteScrollRef}
              label="Minute"
            />
            
            {!format24h && (
              <TimeColumn
                items={periods}
                selectedValue={selectedPeriod}
                onSelect={handlePeriodSelect}
                scrollRef={periodScrollRef}
                label="Period"
                isPeriod={true}
              />
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedHour('');
                setSelectedMinute('');
                setSelectedPeriod('AM');
                setDisplayValue('');
                if (onChange) {
                  const event = {
                    target: {
                      name: name,
                      value: ''
                    }
                  };
                  onChange(event);
                }
              }}
              className="flex-1"
            >
              Clear
            </Button>
            
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={!selectedHour || !selectedMinute}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { TimePicker };
