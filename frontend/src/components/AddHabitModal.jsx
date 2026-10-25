import { useState } from 'react';

/**
 * Modal for adding a new habit
 */
const AddHabitModal = ({ isOpen, onClose, onAdd }) => {
  const [habitName, setHabitName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd(habitName.trim());
      setHabitName('');
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-habit-title">
        <div className="modal-header">
          <h2 className="modal-title" id="add-habit-title">Add New Habit</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="habit-name-input">
              Habit Name
            </label>
            <input
              id="habit-name-input"
              type="text"
              className="form-input"
              placeholder="e.g., Morning Meditation, Read 30 mins..."
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!habitName.trim() || isSubmitting}
              id="confirm-add-habit"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Adding...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Habit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabitModal;
