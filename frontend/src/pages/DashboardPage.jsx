import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import ProgressBar from '../components/ProgressBar';
import DateNavigator from '../components/DateNavigator';
import AnalyticsPanel from '../components/AnalyticsPanel';

/**
 * Main dashboard page – the heart of HabitX
 */

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getTodayString();

const DashboardPage = ({ user, onLogout, addToast, onNavigateGoals }) => {
  // ── Core State ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(today);
  const [habits, setHabits]             = useState([]);
  const [dashboard, setDashboard]       = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId]     = useState(null);

  // ── Analytics Panel State ───────────────────────────────────
  const [panelOpen, setPanelOpen]     = useState(false);
  const [panelCard, setPanelCard]     = useState(null);
  const [analytics, setAnalytics]     = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const analyticsCache = useRef(null);

  // ── Fetch dashboard + habits for a date ────────────────────
  const fetchData = useCallback(async (date) => {
    try {
      const [habitsRes, dashRes] = await Promise.all([
        API.get(`/habits?date=${date}`),
        API.get(`/dashboard?date=${date}`),
      ]);
      if (habitsRes.data.success)  setHabits(habitsRes.data.data);
      if (dashRes.data.success)    setDashboard(dashRes.data.data);
    } catch {
      addToast('error', 'Failed to load data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    setIsLoading(true);
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // ── Fetch analytics (cached until page refresh) ────────────
  const fetchAnalytics = useCallback(async () => {
    if (analyticsCache.current) {
      setAnalytics(analyticsCache.current);
      return;
    }
    setAnalyticsLoading(true);
    try {
      const res = await API.get('/analytics');
      if (res.data.success) {
        analyticsCache.current = res.data.data;
        setAnalytics(res.data.data);
      }
    } catch {
      addToast('error', 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [addToast]);

  // ── Open analytics panel ───────────────────────────────────
  const openPanel = (cardType) => {
    setPanelCard(cardType);
    setPanelOpen(true);
    fetchAnalytics();
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setPanelCard(null), 350);
  };

  // ── Habit actions ──────────────────────────────────────────
  const handleAddHabit = async (habitName) => {
    try {
      const res = await API.post('/habits', { habitName });
      if (res.data.success) {
        addToast('success', `"${habitName}" added! Let's build a streak 🔥`);
        // Invalidate analytics cache
        analyticsCache.current = null;
        await fetchData(selectedDate);
      } else {
        addToast('error', res.data.error || 'Failed to add habit');
      }
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to add habit');
      throw err;
    }
  };

  const handleToggle = async (habitId) => {
    setTogglingId(habitId);
    try {
      const res = await API.post('/habits/log', { habitId, date: selectedDate });
      if (res.data.success) {
        const { completed } = res.data.data;
        addToast(
          completed ? 'success' : 'info',
          completed ? 'Great job! Habit completed ✨' : 'Habit unmarked'
        );
        analyticsCache.current = null;
        await fetchData(selectedDate);
      }
    } catch {
      addToast('error', 'Failed to update habit');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (habitId) => {
    try {
      const res = await API.delete(`/habits/${habitId}`);
      if (res.data.success) {
        addToast('info', 'Habit removed');
        analyticsCache.current = null;
        await fetchData(selectedDate);
      }
    } catch {
      addToast('error', 'Failed to delete habit');
    }
  };

  // ── Loading skeleton ───────────────────────────────────────
  if (isLoading && !dashboard) {
    return (
      <div className="dashboard">
        <Navbar user={user} onLogout={onLogout} />
        <div className="loading-container" style={{ minHeight: '80vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const stats = dashboard || {
    userName: user?.name || 'User',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    selectedDate: today,
    totalHabits: 0,
    completedToday: 0,
    totalCompleted: 0,
    bestStreak: 0,
    completionPercentage: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    weeklyLabels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    weeklyDates: [],
    selectedDayIndex: -1,
  };

  const maxWeekly = Math.max(...(stats.weeklyData || [1]), 1);
  const isPastDate = selectedDate < today;
  const isFutureDate = selectedDate > today;

  return (
    <div className="dashboard">
      <Navbar user={user} onLogout={onLogout} onNavigateGoals={onNavigateGoals} />

      <div className="dashboard-content">
        {/* ── Greeting ── */}
        <div className="dashboard-greeting">
          <h1>
            Good {getGreeting()}, <span>{stats.userName}</span>
          </h1>
          <p>
            {isFutureDate
              ? "Planning ahead? You can't complete future habits yet."
              : isPastDate
              ? 'Viewing a past day — you can still toggle completions.'
              : "Here's your habit progress for today. Keep pushing! 💪"}
          </p>
        </div>

        {/* ── Date Navigator ── */}
        <div className="date-navigator-wrapper">
          <DateNavigator
            selectedDate={selectedDate}
            onDateChange={(d) => {
              setSelectedDate(d);
              closePanel();
            }}
          />
        </div>

        {/* ── Goals Entry Card ── */}
        <div className="goals-entry-wrapper">
          <button 
            className="card goals-entry-card" 
            onClick={onNavigateGoals}
            aria-label="Open Goals Section"
          >
            <div className="goals-entry-icon">🎯</div>
            <div className="goals-entry-text">
              <h3>Goals</h3>
              <p>Track your long-term journey</p>
            </div>
            <div className="goals-entry-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        </div>

        {/* ── Stat Cards (clickable) ── */}
        <div className="stats-grid">
          <button
            className="card stat-card accent clickable-stat"
            style={{ animationDelay: '0.05s' }}
            onClick={() => openPanel('totalHabits')}
            id="stat-total-habits"
            aria-label="View total habits analytics"
          >
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.totalHabits}</div>
            <div className="stat-label">Total Habits</div>
            <div className="stat-click-hint">Click for insights →</div>
          </button>

          <button
            className="card stat-card success clickable-stat"
            style={{ animationDelay: '0.1s' }}
            onClick={() => openPanel('completedToday')}
            id="stat-completed-today"
            aria-label="View daily performance analytics"
          >
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.completedToday}</div>
            <div className="stat-label">Completed {selectedDate === today ? 'Today' : 'That Day'}</div>
            <div className="stat-click-hint">Click for insights →</div>
          </button>

          <button
            className="card stat-card warning clickable-stat"
            style={{ animationDelay: '0.15s' }}
            onClick={() => openPanel('bestStreak')}
            id="stat-best-streak"
            aria-label="View streak analytics"
          >
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.bestStreak}</div>
            <div className="stat-label">Best Streak</div>
            <div className="stat-click-hint">Click for insights →</div>
          </button>

          <button
            className="card stat-card info clickable-stat"
            style={{ animationDelay: '0.2s' }}
            onClick={() => openPanel('allTimeDone')}
            id="stat-all-time"
            aria-label="View all-time progress analytics"
          >
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{stats.totalCompleted}</div>
            <div className="stat-label">All-time Done</div>
            <div className="stat-click-hint">Click for insights →</div>
          </button>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="main-grid">
          {/* Habits Section */}
          <div>
            <div className="section-header">
              <h2 className="section-title">
                {selectedDate === today
                  ? "Today's Habits"
                  : isPastDate
                  ? '📅 Past Day'
                  : '🔮 Future Day'}
              </h2>
              {!isFutureDate && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(true)}
                  id="add-habit-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Habit
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="loading-skeleton" style={{ height: 70, borderRadius: 12 }} />
                ))}
              </div>
            ) : isFutureDate ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔮</div>
                  <h3>Future Date</h3>
                  <p>You can't track habits for future dates. Navigate back to today to get started!</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedDate(today)}
                    style={{ marginTop: 16 }}
                  >
                    Go to Today
                  </button>
                </div>
              </div>
            ) : habits.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    {isPastDate ? '📭' : '🎯'}
                  </div>
                  <h3>{isPastDate ? 'No habits tracked' : 'No habits yet'}</h3>
                  <p>
                    {isPastDate
                      ? 'No habits were tracked for this day.'
                      : 'Start your journey by adding your first habit. Small steps lead to big changes!'}
                  </p>
                  {!isPastDate && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddModal(true)}
                      style={{ marginTop: 16 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Your First Habit
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="habits-grid">
                {habits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    index={index}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    isToggling={togglingId === habit.id}
                    disabled={isFutureDate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Progress Sidebar ── */}
          <div className="progress-section">
            {/* Completion Progress */}
            <div className="card progress-card" style={{ animationDelay: '0.1s' }}>
              <h3 className="section-title" style={{ marginBottom: 16 }}>
                {selectedDate === today ? "Today's" : 'Day'} Progress
              </h3>
              <ProgressBar
                value={stats.completionPercentage}
                label="Completion Rate"
              />
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: 12,
                textAlign: 'center',
              }}>
                {stats.completedToday} of {stats.totalHabits} habits completed
              </p>
            </div>

            {/* Weekly Overview — dynamic */}
            <div className="card progress-card" style={{ animationDelay: '0.2s' }}>
              <h3 className="section-title" style={{ marginBottom: 4 }}>
                Weekly Overview
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Week of {getWeekLabel(selectedDate)}
              </p>
              <div className="weekly-chart">
                {stats.weeklyData?.map((count, i) => {
                  const isSelected = i === stats.selectedDayIndex;
                  return (
                    <div
                      className="weekly-bar-wrapper"
                      key={i}
                      style={{ cursor: stats.weeklyDates?.[i] ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (stats.weeklyDates?.[i]) setSelectedDate(stats.weeklyDates[i]);
                      }}
                    >
                      <div
                        className={`weekly-bar ${isSelected ? 'weekly-bar-selected' : ''}`}
                        style={{
                          height: `${Math.max(4, (count / maxWeekly) * 90)}px`,
                          transitionDelay: `${i * 0.05}s`,
                          opacity: count === 0 ? 0.3 : 1,
                        }}
                      >
                        {count > 0 && (
                          <span className="weekly-bar-count">{count}</span>
                        )}
                      </div>
                      <span className={`weekly-bar-label ${isSelected ? 'weekly-bar-label-selected' : ''}`}>
                        {stats.weeklyLabels?.[i] || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Motivational Card */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08))',
                border: '1px solid rgba(56,189,248,0.15)',
                textAlign: 'center',
                padding: 24,
                animationDelay: '0.3s',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                {stats.completionPercentage === 100 ? '🎉' : stats.completionPercentage >= 50 ? '💪' : '🚀'}
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {stats.completionPercentage === 100
                  ? 'Perfect Day!'
                  : stats.completionPercentage >= 50
                  ? 'Great Progress!'
                  : 'Keep Going!'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {stats.completionPercentage === 100
                  ? "You've completed all your habits. Amazing work!"
                  : stats.completionPercentage >= 50
                  ? "You're over halfway there. Finish strong!"
                  : "Every small step counts. You've got this!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Habit Modal ── */}
      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddHabit}
      />

      {/* ── Analytics Slide Panel ── */}
      <AnalyticsPanel
        isOpen={panelOpen}
        onClose={closePanel}
        cardType={panelCard}
        analytics={analyticsLoading ? null : analytics}
        totalHabits={stats.totalHabits}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getWeekLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  // Find Monday
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default DashboardPage;
