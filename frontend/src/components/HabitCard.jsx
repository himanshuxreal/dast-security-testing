/**
 * Individual habit card with toggle and delete
 */
const HabitCard = ({ habit, index, onToggle, onDelete, isToggling }) => {
  const isCompleted = habit.completedToday;

  return (
    <div
      className={`habit-card ${isCompleted ? 'completed' : 'pending'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      id={`habit-card-${habit.id}`}
    >
      {/* Toggle Button */}
      <button
        className={`habit-toggle ${isCompleted ? 'checked' : ''}`}
        onClick={() => onToggle(habit.id)}
        disabled={isToggling}
        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        id={`habit-toggle-${habit.id}`}
      >
        <span className="check-icon">✓</span>
      </button>

      {/* Habit Info */}
      <div className="habit-info">
        <div className="habit-name">{habit.habitName}</div>
        <div className="habit-meta">
          <span className={`habit-streak ${habit.streak === 0 ? 'zero' : ''}`}>
            🔥 {habit.streak} day{habit.streak !== 1 ? 's' : ''}
          </span>
          <span className={`habit-status-badge ${isCompleted ? 'done' : 'pending'}`}>
            {isCompleted ? 'Done' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Delete Button */}
      <div className="habit-actions">
        <button
          className="habit-delete-btn"
          onClick={() => onDelete(habit.id)}
          aria-label="Delete habit"
          id={`habit-delete-${habit.id}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
