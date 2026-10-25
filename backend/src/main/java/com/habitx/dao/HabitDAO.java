package com.habitx.dao;

import com.habitx.db.DatabaseManager;
import com.habitx.model.Habit;

import java.sql.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Data Access Object for Habit operations.
 */
public class HabitDAO {

    private final DatabaseManager db = DatabaseManager.getInstance();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ────────────────────────────────────────────────────────────────────
    //  Core Habit Queries
    // ────────────────────────────────────────────────────────────────────

    /**
     * Get all habits for a user with completion status for the given date and streak.
     */
    public List<Habit> getHabitsForDate(int userId, String date) throws SQLException {
        String sql = """
            SELECT h.id, h.user_id, h.habit_name, h.created_at,
                   CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END AS completed_today
            FROM habits h
            LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
            WHERE h.user_id = ?
            ORDER BY h.created_at DESC
        """;

        List<Habit> habits = new ArrayList<>();
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, date);
            ps.setInt(2, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Habit habit = new Habit();
                    habit.setId(rs.getInt("id"));
                    habit.setUserId(rs.getInt("user_id"));
                    habit.setHabitName(rs.getString("habit_name"));
                    habit.setCreatedAt(rs.getString("created_at"));
                    habit.setCompletedToday(rs.getInt("completed_today") == 1);
                    habit.setStreak(calculateStreak(conn, habit.getId()));
                    habits.add(habit);
                }
            }
        }
        return habits;
    }

    /** Convenience: get habits for today */
    public List<Habit> getHabitsForUser(int userId) throws SQLException {
        return getHabitsForDate(userId, LocalDate.now().format(DATE_FMT));
    }

    /**
     * Add a new habit for a user.
     */
    public Habit addHabit(int userId, String habitName) throws SQLException {
        String sql = "INSERT INTO habits (user_id, habit_name) VALUES (?, ?)";
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, userId);
            ps.setString(2, habitName);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    Habit habit = new Habit();
                    habit.setId(rs.getInt(1));
                    habit.setUserId(userId);
                    habit.setHabitName(habitName);
                    habit.setCompletedToday(false);
                    habit.setStreak(0);
                    return habit;
                }
            }
        }
        return null;
    }

    /**
     * Delete a habit (and its logs via CASCADE).
     */
    public boolean deleteHabit(int habitId, int userId) throws SQLException {
        String sql = "DELETE FROM habits WHERE id = ? AND user_id = ?";
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, habitId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Toggle a habit's completion for a specific date.
     * Returns true if now completed, false if toggled off.
     */
    public boolean toggleHabitLogForDate(int userId, int habitId, String date) throws SQLException {
        try (Connection conn = db.getConnection()) {
            String checkSql = "SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?";
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, habitId);
                ps.setString(2, date);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String deleteSql = "DELETE FROM habit_logs WHERE id = ?";
                        try (PreparedStatement delPs = conn.prepareStatement(deleteSql)) {
                            delPs.setInt(1, rs.getInt("id"));
                            delPs.executeUpdate();
                        }
                        return false;
                    }
                }
            }

            String insertSql = "INSERT INTO habit_logs (user_id, habit_id, date, status) VALUES (?, ?, ?, 'done')";
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setInt(1, userId);
                ps.setInt(2, habitId);
                ps.setString(3, date);
                ps.executeUpdate();
            }
            return true;
        }
    }

    /** Convenience: toggle for today */
    public boolean toggleHabitLog(int userId, int habitId) throws SQLException {
        return toggleHabitLogForDate(userId, habitId, LocalDate.now().format(DATE_FMT));
    }

    // ────────────────────────────────────────────────────────────────────
    //  Streak Calculation
    // ────────────────────────────────────────────────────────────────────

    private int calculateStreak(Connection conn, int habitId) throws SQLException {
        String sql = "SELECT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, habitId);
            try (ResultSet rs = ps.executeQuery()) {
                int streak = 0;
                LocalDate expected = LocalDate.now();

                while (rs.next()) {
                    LocalDate logDate = LocalDate.parse(rs.getString("date"), DATE_FMT);

                    if (logDate.equals(expected)) {
                        streak++;
                        expected = expected.minusDays(1);
                    } else if (streak == 0 && logDate.equals(expected.minusDays(1))) {
                        expected = expected.minusDays(1);
                        streak++;
                        expected = expected.minusDays(1);
                    } else {
                        break;
                    }
                }
                return streak;
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────
    //  Dashboard Stats (date-aware)
    // ────────────────────────────────────────────────────────────────────

    /**
     * Get dashboard statistics for a specific date.
     */
    public DashboardStats getDashboardStatsForDate(int userId, String date) throws SQLException {
        DashboardStats stats = new DashboardStats();

        // Parse date to get the week
        LocalDate selectedDate = LocalDate.parse(date, DATE_FMT);

        try (Connection conn = db.getConnection()) {
            // Total habits
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM habits WHERE user_id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    stats.totalHabits = rs.next() ? rs.getInt(1) : 0;
                }
            }

            // Completed on selected date
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date = ?")) {
                ps.setInt(1, userId);
                ps.setString(2, date);
                try (ResultSet rs = ps.executeQuery()) {
                    stats.completedToday = rs.next() ? rs.getInt(1) : 0;
                }
            }

            // Total completed all time
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM habit_logs WHERE user_id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    stats.totalCompleted = rs.next() ? rs.getInt(1) : 0;
                }
            }

            // Best streak across all habits (always calculated from today)
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id FROM habits WHERE user_id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    int bestStreak = 0;
                    String bestStreakHabit = "";
                    while (rs.next()) {
                        int hId = rs.getInt("id");
                        int streak = calculateStreak(conn, hId);
                        if (streak > bestStreak) bestStreak = streak;
                    }
                    stats.bestStreak = bestStreak;
                }
            }

            // Weekly overview: Mon–Sun of the selected date's week
            // Find Monday of the selected date's week
            LocalDate monday = selectedDate;
            while (monday.getDayOfWeek().getValue() != 1) {
                monday = monday.minusDays(1);
            }

            stats.weeklyData = new int[7];
            stats.weeklyLabels = new String[7];
            stats.weeklyDates = new String[7];

            for (int i = 0; i < 7; i++) {
                LocalDate day = monday.plusDays(i);
                String dayStr = day.format(DATE_FMT);
                stats.weeklyDates[i] = dayStr;
                stats.weeklyLabels[i] = day.getDayOfWeek().toString().substring(0, 3);

                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date = ?")) {
                    ps.setInt(1, userId);
                    ps.setString(2, dayStr);
                    try (ResultSet rs = ps.executeQuery()) {
                        stats.weeklyData[i] = rs.next() ? rs.getInt(1) : 0;
                    }
                }
            }

            // Which index is the selected date
            stats.selectedDayIndex = -1;
            for (int i = 0; i < 7; i++) {
                if (stats.weeklyDates[i].equals(date)) {
                    stats.selectedDayIndex = i;
                    break;
                }
            }

            // Completion percentage
            stats.completionPercentage = stats.totalHabits > 0
                    ? Math.round((float) stats.completedToday / stats.totalHabits * 100)
                    : 0;
        }

        return stats;
    }

    /** Convenience: stats for today */
    public DashboardStats getDashboardStats(int userId) throws SQLException {
        return getDashboardStatsForDate(userId, LocalDate.now().format(DATE_FMT));
    }

    // ────────────────────────────────────────────────────────────────────
    //  Analytics Data
    // ────────────────────────────────────────────────────────────────────

    /**
     * Get rich analytics data for charts.
     */
    public AnalyticsData getAnalyticsData(int userId) throws SQLException {
        AnalyticsData data = new AnalyticsData();

        try (Connection conn = db.getConnection()) {
            // Per-habit completion rates and streaks
            String habitSql = "SELECT id, habit_name, created_at FROM habits WHERE user_id = ? ORDER BY created_at DESC";
            List<HabitStat> habitStats = new ArrayList<>();

            try (PreparedStatement ps = conn.prepareStatement(habitSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int hId = rs.getInt("id");
                        String hName = rs.getString("habit_name");

                        // Total completions for this habit
                        int totalComp = 0;
                        try (PreparedStatement ps2 = conn.prepareStatement(
                                "SELECT COUNT(*) FROM habit_logs WHERE habit_id = ?")) {
                            ps2.setInt(1, hId);
                            try (ResultSet rs2 = ps2.executeQuery()) {
                                if (rs2.next()) totalComp = rs2.getInt(1);
                            }
                        }

                        // Days since creation
                        String createdAt = rs.getString("created_at");
                        int daysSinceCreation = 1;
                        try {
                            LocalDate created = LocalDate.parse(createdAt.substring(0, 10), DATE_FMT);
                            daysSinceCreation = Math.max(1, (int) (LocalDate.now().toEpochDay() - created.toEpochDay()) + 1);
                        } catch (Exception ignored) {}

                        int completionRate = Math.min(100, Math.round((float) totalComp / daysSinceCreation * 100));
                        int streak = calculateStreak(conn, hId);

                        HabitStat hs = new HabitStat();
                        hs.id = hId;
                        hs.name = hName;
                        hs.totalCompletions = totalComp;
                        hs.completionRate = completionRate;
                        hs.streak = streak;
                        habitStats.add(hs);
                    }
                }
            }
            data.habitStats = habitStats;

            // Most/least consistent
            data.mostConsistentHabit = habitStats.stream()
                    .max(Comparator.comparingInt(h -> h.completionRate))
                    .map(h -> h.name).orElse("N/A");
            data.leastConsistentHabit = habitStats.stream()
                    .min(Comparator.comparingInt(h -> h.completionRate))
                    .map(h -> h.name).orElse("N/A");
            data.longestStreakHabit = habitStats.stream()
                    .max(Comparator.comparingInt(h -> h.streak))
                    .map(h -> h.name).orElse("N/A");

            // Last 30 days daily completions
            data.last30Days = new ArrayList<>();
            for (int i = 29; i >= 0; i--) {
                LocalDate d = LocalDate.now().minusDays(i);
                String dStr = d.format(DATE_FMT);
                int count = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date = ?")) {
                    ps.setInt(1, userId);
                    ps.setString(2, dStr);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) count = rs.getInt(1);
                    }
                }
                DailyCount dc = new DailyCount();
                dc.date = dStr;
                dc.count = count;
                dc.label = d.getMonthValue() + "/" + d.getDayOfMonth();
                data.last30Days.add(dc);
            }

            // Best/worst day in last 30 days
            int bestCount = -1, worstCount = Integer.MAX_VALUE;
            String bestDay = "N/A", worstDay = "N/A";
            for (DailyCount dc : data.last30Days) {
                if (dc.count > bestCount) { bestCount = dc.count; bestDay = dc.date; }
                if (dc.count < worstCount) { worstCount = dc.count; worstDay = dc.date; }
            }
            data.bestDay = bestDay;
            data.worstDay = worstDay;

            // All-time completions per month (last 12 months)
            data.monthlyTotals = new ArrayList<>();
            for (int i = 11; i >= 0; i--) {
                LocalDate month = LocalDate.now().minusMonths(i).withDayOfMonth(1);
                String monthStart = month.format(DATE_FMT);
                String monthEnd = month.withDayOfMonth(month.lengthOfMonth()).format(DATE_FMT);

                int count = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date >= ? AND date <= ?")) {
                    ps.setInt(1, userId);
                    ps.setString(2, monthStart);
                    ps.setString(3, monthEnd);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) count = rs.getInt(1);
                    }
                }
                MonthlyCount mc = new MonthlyCount();
                mc.label = month.getMonth().toString().substring(0, 3) + " " + month.getYear();
                mc.count = count;
                mc.runningTotal = 0; // computed client-side
                data.monthlyTotals.add(mc);
            }

            // Running total for area chart
            int running = 0;
            for (MonthlyCount mc : data.monthlyTotals) {
                running += mc.count;
                mc.runningTotal = running;
            }

            // Total all-time
            data.allTimeDone = data.monthlyTotals.isEmpty() ? 0
                    : data.monthlyTotals.get(data.monthlyTotals.size() - 1).runningTotal;

            // Heatmap: last 365 days
            data.heatmapData = new ArrayList<>();
            for (int i = 364; i >= 0; i--) {
                LocalDate d = LocalDate.now().minusDays(i);
                String dStr = d.format(DATE_FMT);
                int count = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date = ?")) {
                    ps.setInt(1, userId);
                    ps.setString(2, dStr);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) count = rs.getInt(1);
                    }
                }
                HeatmapDay hd = new HeatmapDay();
                hd.date = dStr;
                hd.count = count;
                data.heatmapData.add(hd);
            }

            // Current streak (best across all habits)
            int currentBestStreak = habitStats.stream()
                    .mapToInt(h -> h.streak).max().orElse(0);
            data.currentBestStreak = currentBestStreak;

            // All-time best streak (needs full history scan — approximate with current)
            data.allTimeBestStreak = habitStats.stream()
                    .mapToInt(h -> h.totalCompletions).sum() > 0 ? currentBestStreak : 0;
        }

        return data;
    }

    // ────────────────────────────────────────────────────────────────────
    //  Data Classes
    // ────────────────────────────────────────────────────────────────────

    public static class DashboardStats {
        public int totalHabits;
        public int completedToday;
        public int totalCompleted;
        public int bestStreak;
        public int completionPercentage;
        public int[] weeklyData;
        public String[] weeklyLabels;
        public String[] weeklyDates;
        public int selectedDayIndex;
    }

    public static class AnalyticsData {
        public List<HabitStat> habitStats;
        public String mostConsistentHabit;
        public String leastConsistentHabit;
        public String longestStreakHabit;
        public List<DailyCount> last30Days;
        public String bestDay;
        public String worstDay;
        public List<MonthlyCount> monthlyTotals;
        public int allTimeDone;
        public int currentBestStreak;
        public int allTimeBestStreak;
        public List<HeatmapDay> heatmapData;
    }

    public static class HabitStat {
        public int id;
        public String name;
        public int totalCompletions;
        public int completionRate;
        public int streak;
    }

    public static class DailyCount {
        public String date;
        public String label;
        public int count;
    }

    public static class MonthlyCount {
        public String label;
        public int count;
        public int runningTotal;
    }

    public static class HeatmapDay {
        public String date;
        public int count;
    }
}
