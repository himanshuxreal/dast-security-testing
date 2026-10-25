package com.habitx.model;

public class Goal {
    private int id;
    private int userId;
    private String title;
    private String description;
    private int targetValue;
    private int currentValue;
    private String category;
    private String linkedHabit;
    private boolean isFocus;
    private String createdAt;

    public Goal() {}

    public Goal(int id, int userId, String title, String description, int targetValue, int currentValue, String category, String linkedHabit, boolean isFocus, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.targetValue = targetValue;
        this.currentValue = currentValue;
        this.category = category;
        this.linkedHabit = linkedHabit;
        this.isFocus = isFocus;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getTargetValue() { return targetValue; }
    public void setTargetValue(int targetValue) { this.targetValue = targetValue; }
    public int getCurrentValue() { return currentValue; }
    public void setCurrentValue(int currentValue) { this.currentValue = currentValue; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLinkedHabit() { return linkedHabit; }
    public void setLinkedHabit(String linkedHabit) { this.linkedHabit = linkedHabit; }
    public boolean isFocus() { return isFocus; }
    public void setFocus(boolean focus) { isFocus = focus; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
