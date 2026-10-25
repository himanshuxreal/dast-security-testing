package com.habitx.model;

/**
 * HabitLog model representing a daily habit completion record.
 */
public class HabitLog {
    private int id;
    private int userId;
    private int habitId;
    private String date;
    private String status;

    public HabitLog() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public int getHabitId() { return habitId; }
    public void setHabitId(int habitId) { this.habitId = habitId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
