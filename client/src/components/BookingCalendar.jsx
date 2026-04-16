import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isWithinInterval, isBefore, addMonths, subMonths } from 'date-fns';

export default function BookingCalendar({ bookedRanges = [], selectedStart, selectedEnd, onSelect, disabled = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateBooked = (date) => {
    return bookedRanges.some(range => {
      const start = new Date(range.start_date);
      const end = new Date(range.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return isWithinInterval(date, { start, end });
    });
  };

  const handleDayClick = (day) => {
    if (disabled) return;
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);

    if (isBefore(d, today) || isDateBooked(d)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelect(d, null);
    } else {
      if (isBefore(d, selectedStart)) {
        onSelect(d, null);
      } else {
        // Check if any booked date is in the range
        let current = new Date(selectedStart);
        while (current <= d) {
          if (isDateBooked(current)) {
            onSelect(d, null);
            return;
          }
          current = addDays(current, 1);
        }
        onSelect(selectedStart, d);
      }
    }
  };

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const result = [];
    let day = calStart;
    while (day <= calEnd) {
      result.push(new Date(day));
      day = addDays(day, 1);
    }
    return result;
  }, [currentMonth]);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} type="button">
          <ChevronLeft size={20} />
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} type="button">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isPast = isBefore(day, today);
          const booked = isDateBooked(day);
          const isSelected = (selectedStart && isSameDay(day, selectedStart)) || (selectedEnd && isSameDay(day, selectedEnd));
          const inRange = selectedStart && selectedEnd && isWithinInterval(day, { start: selectedStart, end: selectedEnd });

          let className = 'calendar-day';
          if (!inMonth) className += ' empty disabled';
          else if (isPast) className += ' disabled';
          else if (booked) className += ' booked';
          else if (isSelected) className += ' selected';
          else if (inRange) className += ' in-range';
          if (isToday && inMonth) className += ' today';

          return (
            <button
              key={i}
              className={className}
              onClick={() => inMonth && handleDayClick(day)}
              type="button"
              disabled={!inMonth || isPast || booked || disabled}
            >
              {inMonth ? format(day, 'd') : ''}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <div className="calendar-legend-dot" style={{ background: 'var(--color-primary)' }} />
          <span>Selected</span>
        </div>
        <div className="calendar-legend-item">
          <div className="calendar-legend-dot" style={{ background: 'var(--color-primary-glow)' }} />
          <span>Range</span>
        </div>
        <div className="calendar-legend-item">
          <div className="calendar-legend-dot" style={{ background: 'var(--color-danger-glow)' }} />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
