import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Date navigation bar — prev/next arrows + custom calendar popup.
 */
const DateNavigator = ({ selectedDate, onDateChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const isShifting = useRef(false);

  const [viewDate, setViewDate] = useState(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  useEffect(() => {
    if (showPicker) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [showPicker, selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(new Date());
  const isFuture = selectedDate >= todayStr;

  const shift = useCallback((e, days) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isShifting.current) return;
    isShifting.current = true;
    setTimeout(() => { isShifting.current = false; }, 300);
    
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    
    const newDateStr = formatDate(dateObj);
    if (newDateStr !== selectedDate) {
      onDateChange(newDateStr);
    }
  }, [selectedDate, onDateChange]);

  const formatDisplay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateStr === todayStr) return 'Today';
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    if (dateStr === formatDate(yesterdayDate)) return 'Yesterday';
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const handleDaySelect = (day) => {
    const newDateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const newDateStr = formatDate(newDateObj);
    if (newDateStr !== selectedDate) {
      onDateChange(newDateStr);
    }
    setShowPicker(false);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const renderCalendar = () => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon-Sun
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const [selY, selM, selD] = selectedDate.split('-').map(Number);
    const today = new Date();

    return (
      <div className="custom-calendar">
        <div className="calendar-header">
          <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} aria-label="Previous Month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="cal-month-year">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
          <button type="button" className="cal-nav-btn" onClick={handleNextMonth} aria-label="Next Month">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="calendar-grid">
          {weekDays.map(d => <div key={d} className="cal-weekday">{d}</div>)}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-day empty"></div>;
            
            const isSelected = day === selD && viewDate.getMonth() + 1 === selM && viewDate.getFullYear() === selY;
            const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
            
            return (
              <button
                type="button"
                key={i}
                className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => handleDaySelect(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="calendar-footer">
          <button type="button" className="cal-today-btn" onClick={() => { onDateChange(todayStr); setShowPicker(false); }}>Go to Today</button>
        </div>
      </div>
    );
  };

  return (
    <div className="date-navigator" id="date-navigator">
      <button
        type="button"
        className="date-nav-btn"
        onClick={(e) => shift(e, -1)}
        aria-label="Previous day"
        id="date-prev-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className={`date-display-wrapper ${showPicker ? 'picker-open' : ''}`} ref={pickerRef}>
        <button
          type="button"
          className={`date-display ${selectedDate === todayStr ? 'is-today' : ''}`}
          onClick={() => setShowPicker(!showPicker)}
          id="date-display-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDisplay(selectedDate)}</span>
          {selectedDate === todayStr && <span className="today-badge">TODAY</span>}
        </button>

        {showPicker && (
          <div className="date-picker-dropdown">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'center', marginBottom: '4px' }}>
              Select Date
            </span>
            {renderCalendar()}
          </div>
        )}
      </div>

      <button
        type="button"
        className="date-nav-btn"
        onClick={(e) => shift(e, 1)}
        aria-label="Next day"
        id="date-next-btn"
        disabled={isFuture}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {selectedDate !== todayStr && (
        <button
          type="button"
          className="btn btn-sm date-today-btn"
          onClick={() => onDateChange(todayStr)}
          id="go-to-today-btn"
        >
          Go to Today
        </button>
      )}
    </div>
  );
};

export default DateNavigator;
