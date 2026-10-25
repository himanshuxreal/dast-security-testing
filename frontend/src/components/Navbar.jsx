import { useState, useEffect } from 'react';
import Logo from './Logo';

/**
 * Top navigation bar component
 */
const Navbar = ({ user, onLogout, onNavigateGoals }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for "live" feel

    return () => clearInterval(timer);
  }, []);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (dateObj) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateStr = dateObj.toLocaleDateString('en-US', options);
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    // Format: "Sunday, April 26, 2026 — 10:42:05 PM"
    return `${dateStr} — ${timeStr}`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Logo size={28} />
        HabitX
      </div>

      <div className="navbar-right">
        <div className="navbar-time-display" title="Current system time">
          {formatDateTime(currentTime)}
        </div>
        {user && (
          <>
            {onNavigateGoals && (
              <button 
                className="navbar-icon-btn" 
                onClick={onNavigateGoals}
                title="Goals"
                aria-label="Goals"
              >
                🎯
              </button>
            )}
            <div className="navbar-user">
              <div className="navbar-user-avatar">
                {getInitials(user.name)}
              </div>
              <span>{user.name}</span>
            </div>
            <button
              className="btn btn-logout"
              onClick={onLogout}
              id="logout-btn"
              aria-label="Logout"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
