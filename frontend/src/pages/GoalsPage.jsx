import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { getGoalsByCategory, createGoal, updateGoal, updateGoalProgress, deleteGoal } from '../api/goals';

const QUOTES = [
  { text: "Discipline is choosing between what you want now and ", highlight: "what you want most." },
  { text: "Consistency creates ", highlight: "mastery." },
  { text: "Small habits build ", highlight: "unstoppable momentum." },
  { text: "You don't rise to the level of goals, you fall to the level of ", highlight: "systems." },
  { text: "Focus on progress, not ", highlight: "perfection." },
  { text: "Greatness is built ", highlight: "daily." },
  { text: "Stay consistent, ", highlight: "results will follow." },
  { text: "Your future is created by what you do ", highlight: "today." },
];

const CATEGORY_CONFIG = {
  weekly: {
    icon: '⚡',
    label: 'Weekly',
    emptyTitle: 'No weekly goals yet',
    emptyMessage: 'Start small and stay consistent — set your first weekly milestone.',
    completedEmpty: 'Complete weekly goals to see them here.',
    color: '#38bdf8',
  },
  monthly: {
    icon: '🌙',
    label: 'Monthly',
    emptyTitle: 'No monthly goals yet',
    emptyMessage: 'Set a steady pace for the month — define your next milestone.',
    completedEmpty: 'Complete monthly goals to see them here.',
    color: '#a855f7',
  },
  yearly: {
    icon: '🌟',
    label: 'Yearly',
    emptyTitle: 'No yearly goals yet',
    emptyMessage: 'Plan your ultimate vision — think big and aim high.',
    completedEmpty: 'Complete yearly goals to see them here.',
    color: '#facc15',
  },
};

const GoalsPage = ({ user, onLogout, onBack }) => {
  const [mounted, setMounted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(true);

  // Per-category state
  const [goalsByCategory, setGoalsByCategory] = useState({
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [loadingCategory, setLoadingCategory] = useState({
    weekly: false,
    monthly: false,
    yearly: false,
  });
  const [errorCategory, setErrorCategory] = useState({
    weekly: null,
    monthly: null,
    yearly: null,
  });

  const [activeTab, setActiveTab] = useState('weekly');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal form state
  const [form, setForm] = useState({
    title: '', linkedHabit: '', targetValue: '', currentValue: '',
    category: 'weekly', description: '', isFocus: false,
  });

  // Fetch goals for a specific category from the database
  const loadCategoryGoals = useCallback(async (category) => {
    setLoadingCategory(prev => ({ ...prev, [category]: true }));
    setErrorCategory(prev => ({ ...prev, [category]: null }));
    try {
      const data = await getGoalsByCategory(category);
      setGoalsByCategory(prev => ({ ...prev, [category]: data }));
    } catch (err) {
      console.error(`Failed to load ${category} goals`, err);
      setErrorCategory(prev => ({ ...prev, [category]: `Failed to load ${category} goals` }));
    } finally {
      setLoadingCategory(prev => ({ ...prev, [category]: false }));
    }
  }, []);

  // Load all categories on mount
  useEffect(() => {
    loadCategoryGoals('weekly');
    loadCategoryGoals('monthly');
    loadCategoryGoals('yearly');
    setTimeout(() => setMounted(true), 100);

    const quoteInterval = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        setFadeQuote(true);
      }, 500);
    }, 8000);

    return () => clearInterval(quoteInterval);
  }, [loadCategoryGoals]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Refresh the tab data on switch to ensure freshness
    loadCategoryGoals(tab);
  };

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setForm({ ...goal });
    } else {
      setEditingGoal(null);
      setForm({
        title: '', linkedHabit: '', targetValue: '', currentValue: '0',
        category: activeTab, description: '', isFocus: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetValue: parseInt(form.targetValue, 10) || 1,
        currentValue: parseInt(form.currentValue, 10) || 0,
      };

      if (editingGoal) {
        await updateGoal({ ...payload, id: editingGoal.id });
        // Refresh the category the goal belongs to (and old category if changed)
        await loadCategoryGoals(payload.category);
        if (editingGoal.category !== payload.category) {
          await loadCategoryGoals(editingGoal.category);
        }
      } else {
        await createGoal(payload);
        await loadCategoryGoals(payload.category);
      }
      setShowModal(false);
      setEditingGoal(null);
    } catch (err) {
      console.error('Failed to save goal', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goal.id);
        await loadCategoryGoals(goal.category);
        setShowModal(false);
        setEditingGoal(null);
      } catch (err) {
        console.error('Failed to delete goal', err);
      }
    }
  };

  const handleProgressIncrement = async (e, goal) => {
    e.stopPropagation();
    const newValue = Math.min(goal.currentValue + 1, goal.targetValue);
    if (newValue === goal.currentValue) return;
    try {
      await updateGoalProgress(goal.id, newValue);
      await loadCategoryGoals(goal.category);
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  };

  // Current tab data
  const currentGoals = goalsByCategory[activeTab] || [];
  const activeGoals = currentGoals.filter(g => Number(g.currentValue) < Number(g.targetValue));
  const completedGoals = currentGoals.filter(g => Number(g.currentValue) >= Number(g.targetValue));
  const isLoading = loadingCategory[activeTab];
  const error = errorCategory[activeTab];
  const config = CATEGORY_CONFIG[activeTab];

  // Cross-category focus goal (show focus from the active tab only)
  const focusGoal = currentGoals.find(g => g.isFocus);

  // Per-tab stats
  const tabCompleted = completedGoals.length;
  const tabTotal = currentGoals.length || 1;
  const tabAvgCompletion = Math.round(
    currentGoals.reduce((acc, g) => acc + Math.min((g.currentValue / g.targetValue) * 100, 100), 0) / tabTotal
  ) || 0;

  return (
    <div className={`goals-page theme-${activeTab}`}>
      <div className="cosmic-bg">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar user={user} onLogout={onLogout} onNavigateGoals={() => {}} />
      </div>

      <div className="goals-container">
        {/* ── HERO SECTION ── */}
        <div className="goals-hero">
          <h1 className={`quote-text ${fadeQuote ? 'fade-in' : 'fade-out'}`}>
            "{QUOTES[quoteIndex].text}
            <br/><span>{QUOTES[quoteIndex].highlight}</span>"
          </h1>
          <p>Your journey is defined by consistency, not intensity.</p>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="g-tabs">
          {['weekly', 'monthly', 'yearly'].map(tab => (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`g-tab tab-${tab} ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {CATEGORY_CONFIG[tab].icon} {CATEGORY_CONFIG[tab].label}
              {goalsByCategory[tab].length > 0 && (
                <span className="g-tab-count">{goalsByCategory[tab].length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── LOADING / ERROR STATE ── */}
        {isLoading && (
          <div className="g-loading-state">
            <div className="g-spinner"></div>
            <p>Loading {config.label.toLowerCase()} goals...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="g-error-state">
            <p>⚠️ {error}</p>
            <button className="g-retry-btn" onClick={() => loadCategoryGoals(activeTab)}>Retry</button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="goals-grid">
            {/* ── FOCUS GOAL ── */}
            {focusGoal && (
              <div className={`g-card g-focus focus-theme-${focusGoal.category}`} style={{ animationDelay: '0.1s' }}>
                <div className="g-card-header">
                  <span className="g-badge focus-badge">
                    <span className="pulse-dot"></span> 🎯 Focus Goal
                  </span>
                  <div className="g-header-actions">
                    {focusGoal.linkedHabit && (
                      <span className="g-habit-link">Linked: <span>{focusGoal.linkedHabit}</span></span>
                    )}
                    <button className="g-edit-icon" onClick={() => handleOpenModal(focusGoal)}>✎</button>
                  </div>
                </div>
                <h2 className="g-title-large">{focusGoal.title}</h2>
                {focusGoal.description && <p className="g-desc">{focusGoal.description}</p>}
                <div className="g-progress-container mt-lg">
                  <div className="g-progress-header">
                    <span className="g-progress-label">Progress</span>
                    <span className="g-progress-text">{focusGoal.currentValue} / {focusGoal.targetValue}</span>
                  </div>
                  <div className="g-progress-track large-track">
                    <div 
                      className="g-progress-fill focus-fill" 
                      style={{ width: mounted ? `${Math.min((focusGoal.currentValue/focusGoal.targetValue)*100, 100)}%` : '0%' }}
                    ></div>
                  </div>
                  {focusGoal.currentValue < focusGoal.targetValue && (
                    <button className="g-progress-btn" onClick={(e) => handleProgressIncrement(e, focusGoal)}>
                      +1 Progress
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── CATEGORY INSIGHT ── */}
            <div className={`g-card ${focusGoal ? 'g-insight' : 'g-consistency'}`} style={{ animationDelay: '0.2s' }}>
              <h3 className="g-title-small mb-md">{config.icon} {config.label} Insights</h3>
              <div className="insight-stat-wrapper">
                <div className="insight-stat">
                  <div className="insight-value">{tabCompleted}</div>
                  <div className="insight-label">{config.label} Goals Conquered</div>
                </div>
                <div className="insight-stat mt-md">
                  <div className="insight-value highlight">{tabAvgCompletion}%</div>
                  <div className="insight-label">{config.label} Completion Rate</div>
                </div>
              </div>
            </div>

            {/* ── ACTIVE GOALS ── */}
            <div className="g-card g-active" style={{ animationDelay: '0.3s' }}>
              <div className="g-card-header mb-md">
                <h3 className="g-title-small">🔥 Active {config.label} Quests</h3>
                <button id="add-goal-btn" className="g-add-btn" onClick={() => handleOpenModal()}>+ Add Goal</button>
              </div>
              <div className="g-list">
                {activeGoals.length === 0 ? (
                  <div className="g-empty-state">
                    <div className="g-empty-icon">{config.icon}</div>
                    <h4 className="g-empty-title">{config.emptyTitle}</h4>
                    <p className="g-empty-msg">{config.emptyMessage}</p>
                    <button className="g-empty-cta" onClick={() => handleOpenModal()}>+ Create {config.label} Goal</button>
                  </div>
                ) : (
                  activeGoals.map((g, i) => (
                    <div key={g.id} className="g-list-item" style={{ animationDelay: `${0.4 + i * 0.1}s` }} onClick={() => handleOpenModal(g)}>
                      <div className="g-list-header">
                        <div>
                          <h4>{g.title}</h4>
                          {g.linkedHabit && <span className="g-habit-sub">via {g.linkedHabit}</span>}
                        </div>
                        <div className="g-list-actions">
                          <span className="g-count">{g.currentValue} / {g.targetValue}</span>
                          <button
                            className="g-increment-btn"
                            title="Add +1 progress"
                            onClick={(e) => handleProgressIncrement(e, g)}
                          >+</button>
                        </div>
                      </div>
                      <div className="g-progress-track">
                        <div 
                          className="g-progress-fill" 
                          style={{ width: mounted ? `${Math.min((g.currentValue/g.targetValue)*100, 100)}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── COMPLETED GOALS ── */}
            <div className="g-card g-completed" style={{ animationDelay: '0.4s' }}>
              <h3 className="g-title-small mb-md">🏆 {config.label} Triumphs</h3>
              <div className="g-list">
                {completedGoals.length === 0 ? (
                  <p className="g-empty">{config.completedEmpty}</p>
                ) : (
                  completedGoals.map((g, i) => (
                    <div key={g.id} className="g-list-item completed-item" style={{ animationDelay: `${0.5 + i * 0.1}s` }} onClick={() => handleOpenModal(g)}>
                      <div className="g-list-header">
                        <div>
                          <h4>{g.title}</h4>
                          {g.linkedHabit && <span className="g-habit-sub">via {g.linkedHabit}</span>}
                        </div>
                        <span className="g-badge success-badge">Completed</span>
                      </div>
                      <div className="g-progress-track">
                        <div className="g-progress-fill success-fill" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '80px', position: 'relative', zIndex: 10 }}>
          <button className="g-return-btn" onClick={onBack}>
            ← Return to Dashboard
          </button>
        </div>
      </div>

      {/* ── EDIT / CREATE MODAL ── */}
      {showModal && (
        <div className="g-modal-overlay" onClick={handleCloseModal}>
          <div className="g-modal-content" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <h2>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
              <button className="g-modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSaveGoal} className="g-modal-form">
              <div className="form-group">
                <label>Goal Title</label>
                <input required type="text" id="goal-title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Read 12 Books" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" id="goal-description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional description..." />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Target</label>
                  <input required type="number" min="1" id="goal-target" value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Current Progress</label>
                  <input required type="number" min="0" id="goal-progress" value={form.currentValue} onChange={e => setForm({...form, currentValue: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category <span className="g-required">*</span></label>
                  <div className="g-category-selector">
                    {['weekly', 'monthly', 'yearly'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`g-cat-option cat-${cat} ${form.category === cat ? 'active' : ''}`}
                        onClick={() => setForm({...form, category: cat})}
                      >
                        {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Linked Habit <span className="g-optional">(optional)</span></label>
                <input type="text" id="goal-linked-habit" value={form.linkedHabit} onChange={e => setForm({...form, linkedHabit: e.target.value})} placeholder="e.g. Daily Reading" />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={form.isFocus} onChange={e => setForm({...form, isFocus: e.target.checked})} />
                  Set as Main Focus Goal
                </label>
              </div>
              
              <div className="g-modal-actions">
                {editingGoal && (
                  <button type="button" className="g-btn-delete" onClick={() => handleDeleteGoal(editingGoal)}>Delete</button>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button type="button" className="g-btn-cancel" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="g-btn-save" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
