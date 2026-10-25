/**
 * Circular/linear progress bar component
 */
const ProgressBar = ({ value = 0, label, showPercentage = true }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="progress-wrapper">
      {label && (
        <div className="progress-header">
          <span className="progress-title">{label}</span>
          {showPercentage && (
            <span className="progress-value">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
