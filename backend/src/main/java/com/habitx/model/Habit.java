package com.habitx.model;

/**
 * Habit model representing a user's habit.
 */
public class Habit {
    private int id;
    private int userId;
    private String habitName;
    private String createdAt;
    private boolean completedToday;
    private int streak;

    public Habit() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getHabitName() { return habitName; }
    public void setHabitName(String habitName) { this.habitName = habitName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public boolean isCompletedToday() { return completedToday; }
    public void setCompletedToday(boolean completedToday) { this.completedToday = completedToday; }

    public int getStreak() { return streak; }
    public void setStreak(int streak) { this.streak = streak; }
}
