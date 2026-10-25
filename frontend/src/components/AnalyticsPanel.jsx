import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────
//  Shared chart theme
// ─────────────────────────────────────────────────────────────
const COLORS = ['#38bdf8', '#818cf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#34d399'];
const CHART_STYLE = { fontSize: 11, fill: '#64748b' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#38bdf8' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Skeleton loader for charts
// ─────────────────────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="chart-skeleton">
    <div className="loading-skeleton" style={{ height: 200, borderRadius: 12 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
//  Insight row
// ─────────────────────────────────────────────────────────────
const InsightRow = ({ icon, label, value, accent }) => (
  <div className="insight-row">
    <span className="insight-icon">{icon}</span>
    <div className="insight-body">
      <span className="insight-label">{label}</span>
      <span className="insight-value" style={{ color: accent || 'var(--accent)' }}>{value}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  Heatmap (GitHub-style, last 52 weeks)
// ─────────────────────────────────────────────────────────────
const Heatmap = ({ data, maxHabits }) => {
  if (!data || data.length === 0) return <ChartSkeleton />;

  const getLevel = (count) => {
    if (count === 0) return 0;
    if (maxHabits <= 0) return 1;
    const pct = count / maxHabits;
    if (pct <= 0.25) return 1;
    if (pct <= 0.5) return 2;
    if (pct <= 0.75) return 3;
    return 4;
  };

  const colors = ['#1e293b', '#0c4a6e', '#0369a1', '#0284c7', '#38bdf8'];

  // Pad to start from Monday
  const padded = [...data];
  const firstDate = new Date(padded[0].date + 'T00:00:00');
  const dayOfWeek = (firstDate.getDay() + 6) % 7; // Mon=0
  const empties = Array.from({ length: dayOfWeek }, (_, i) => ({ date: null, count: -1 }));
  const cells = [...empties, ...padded];

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-inner">
        <div className="heatmap-days">
          {dayLabels.map((d, i) => (
            <div key={i} className="heatmap-day-label">{d}</div>
          ))}
        </div>
        <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wi) =>
            week.map((cell, di) => {
              if (!cell.date) {
                return <div key={`${wi}-${di}`} className="heatmap-cell empty" />;
              }
              const level = getLevel(cell.count);
              return (
                <div
                  key={`${wi}-${di}`}
                  className="heatmap-cell"
                  style={{ background: colors[level] }}
                  title={`${cell.date}: ${cell.count} completions`}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {colors.map((c, i) => (
          <div key={i} className="heatmap-cell" style={{ background: c, width: 12, height: 12 }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Main Analytics Panel
// ─────────────────────────────────────────────────────────────
const AnalyticsPanel = ({ isOpen, onClose, cardType, analytics, totalHabits }) => {
  if (!isOpen) return null;

  const isLoading = !analytics;
  const maxHabits = totalHabits || 1;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      );
    }

    switch (cardType) {
      // ── Total Habits ────────────────────────────────────────
      case 'totalHabits': {
        const pieData = analytics.habitStats?.map((h) => ({
          name: h.name,
          value: h.totalCompletions || 1,
        })) || [];

        const barData = analytics.habitStats?.map((h) => ({
          name: h.name.length > 14 ? h.name.slice(0, 12) + '…' : h.name,
          fullName: h.name,
          rate: h.completionRate,
        })) || [];

        return (
          <>
            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Completion Share</h4>
              {pieData.length === 0 ? (
                <div className="panel-empty">No habits yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Completion Rate Per Habit (%)</h4>
              {barData.length === 0 ? (
                <div className="panel-empty">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, barData.length * 38)}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={CHART_STYLE} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={CHART_STYLE} tickLine={false} axisLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name="Rate %" radius={[0, 4, 4, 0]} fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel-insights">
              <InsightRow icon="🏅" label="Most Consistent" value={analytics.mostConsistentHabit} accent="var(--success)" />
              <InsightRow icon="📉" label="Needs Attention" value={analytics.leastConsistentHabit} accent="var(--warning)" />
            </div>
          </>
        );
      }

      // ── Completed Today ─────────────────────────────────────
      case 'completedToday': {
        const last7 = analytics.last30Days?.slice(-7) || [];
        const last30 = analytics.last30Days || [];

        const bestCount = Math.max(...last30.map(d => d.count), 0);
        const worstCount = Math.min(...last30.filter(d => d.count >= 0).map(d => d.count), 0);
        const bestDay = last30.find(d => d.count === bestCount);
        const worstDay = last30.find(d => d.count === worstCount);

        const formatDay = (d) => d
          ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'N/A';

        return (
          <>
            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Last 7 Days</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={last7} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="label" tick={CHART_STYLE} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={CHART_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="count" name="Completed"
                    stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Last 30 Days</h4>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={last30} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="label" tick={CHART_STYLE} tickLine={false} axisLine={false} interval={4} />
                  <YAxis allowDecimals={false} tick={CHART_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="count" name="Completed"
                    stroke="#818cf8" strokeWidth={2} dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="panel-insights">
              <InsightRow icon="🌟" label="Best Day" value={`${formatDay(bestDay)} — ${bestCount} habits`} accent="var(--success)" />
              <InsightRow icon="😴" label="Worst Day" value={`${formatDay(worstDay)} — ${worstCount} habits`} accent="var(--danger)" />
            </div>
          </>
        );
      }

      // ── Best Streak ─────────────────────────────────────────
      case 'bestStreak': {
        return (
          <>
            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Activity Heatmap (Last 52 Weeks)</h4>
              <Heatmap data={analytics.heatmapData} maxHabits={maxHabits} />
            </div>

            <div className="panel-insights">
              <InsightRow icon="🔥" label="Longest Streak Habit" value={analytics.longestStreakHabit} accent="var(--warning)" />
              <InsightRow icon="⚡" label="Current Best Streak" value={`${analytics.currentBestStreak} days`} accent="var(--accent)" />
              <InsightRow icon="🏆" label="All-Time Best" value={`${analytics.allTimeBestStreak} days`} accent="var(--info)" />
            </div>
          </>
        );
      }

      // ── All-Time Done ────────────────────────────────────────
      case 'allTimeDone': {
        const monthly = analytics.monthlyTotals || [];
        const milestones = [10, 50, 100, 250, 500];
        const total = analytics.allTimeDone || 0;
        const reached = milestones.filter(m => total >= m);
        const next = milestones.find(m => total < m);

        return (
          <>
            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Total Completions Over Time</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="label" tick={CHART_STYLE} tickLine={false} axisLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={CHART_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="runningTotal" name="Total"
                    stroke="#8b5cf6" strokeWidth={2.5} fill="url(#areaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="panel-chart-block">
              <h4 className="panel-chart-title">Milestone Tracker</h4>
              <div className="milestone-grid">
                {milestones.map(m => (
                  <div key={m} className={`milestone-badge ${total >= m ? 'reached' : 'pending'}`}>
                    {total >= m ? '✅' : '🔒'} {m}
                  </div>
                ))}
              </div>
              {next && (
                <div className="milestone-progress-block">
                  <p className="milestone-next-label">Next milestone: <strong>{next}</strong></p>
                  <div className="progress-bar-container" style={{ marginTop: 8 }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (total / next) * 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {total} / {next} ({Math.round((total / next) * 100)}%)
                  </p>
                </div>
              )}
            </div>

            <div className="panel-insights">
              <InsightRow icon="🏆" label="All-Time Completions" value={total} accent="var(--info)" />
              <InsightRow icon="🎯" label="Milestones Reached" value={`${reached.length} / ${milestones.length}`} accent="var(--success)" />
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  const titles = {
    totalHabits: { icon: '📊', label: 'Total Habits Analytics' },
    completedToday: { icon: '✅', label: 'Daily Performance' },
    bestStreak: { icon: '🔥', label: 'Streak Analytics' },
    allTimeDone: { icon: '🏆', label: 'All-Time Progress' },
  };

  const meta = titles[cardType] || { icon: '📈', label: 'Analytics' };

  return (
    <>
      {/* Backdrop */}
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Slide-in panel */}
      <div className="analytics-panel" role="dialog" aria-label="Analytics Panel" id="analytics-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-title">
            <span className="panel-header-icon">{meta.icon}</span>
            <h2 className="panel-title">{meta.label}</h2>
          </div>
          <button
            className="panel-close-btn"
            onClick={onClose}
            aria-label="Close analytics panel"
            id="panel-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="panel-body">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default AnalyticsPanel;
