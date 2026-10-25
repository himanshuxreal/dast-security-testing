package com.habitx.dao;

import com.habitx.db.DatabaseManager;
import com.habitx.model.Goal;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class GoalDAO {
    private final DatabaseManager db = DatabaseManager.getInstance();

    public List<Goal> getGoalsByUserId(int userId) throws SQLException {
        List<Goal> goals = new ArrayList<>();
        String sql = "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC";
        
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    goals.add(mapResultSetToGoal(rs));
                }
            }
        }
        return goals;
    }

    public List<Goal> getGoalsByCategory(int userId, String category) throws SQLException {
        List<Goal> goals = new ArrayList<>();
        String sql = "SELECT * FROM goals WHERE user_id = ? AND category = ? ORDER BY created_at DESC";
        
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setInt(1, userId);
            ps.setString(2, category);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    goals.add(mapResultSetToGoal(rs));
                }
            }
        }
        return goals;
    }

    public boolean updateProgress(int goalId, int userId, int currentValue) throws SQLException {
        String sql = "UPDATE goals SET current_value = ? WHERE id = ? AND user_id = ?";
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, currentValue);
            ps.setInt(2, goalId);
            ps.setInt(3, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public Goal createGoal(Goal goal) throws SQLException {
        if (goal.isFocus()) {
            unsetFocusGoals(goal.getUserId());
        }

        String sql = "INSERT INTO goals (user_id, title, description, target_value, current_value, category, linked_habit, is_focus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
             
            ps.setInt(1, goal.getUserId());
            ps.setString(2, goal.getTitle());
            ps.setString(3, goal.getDescription());
            ps.setInt(4, goal.getTargetValue());
            ps.setInt(5, goal.getCurrentValue());
            ps.setString(6, goal.getCategory());
            ps.setString(7, goal.getLinkedHabit());
            ps.setInt(8, goal.isFocus() ? 1 : 0);
            
            ps.executeUpdate();
            
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    goal.setId(rs.getInt(1));
                }
            }
        }
        return goal;
    }

    public boolean updateGoal(Goal goal) throws SQLException {
        if (goal.isFocus()) {
            unsetFocusGoals(goal.getUserId());
        }

        String sql = "UPDATE goals SET title = ?, description = ?, target_value = ?, current_value = ?, category = ?, linked_habit = ?, is_focus = ? WHERE id = ? AND user_id = ?";
        
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setString(1, goal.getTitle());
            ps.setString(2, goal.getDescription());
            ps.setInt(3, goal.getTargetValue());
            ps.setInt(4, goal.getCurrentValue());
            ps.setString(5, goal.getCategory());
            ps.setString(6, goal.getLinkedHabit());
            ps.setInt(7, goal.isFocus() ? 1 : 0);
            ps.setInt(8, goal.getId());
            ps.setInt(9, goal.getUserId());
            
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteGoal(int goalId, int userId) throws SQLException {
        String sql = "DELETE FROM goals WHERE id = ? AND user_id = ?";
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setInt(1, goalId);
            ps.setInt(2, userId);
            
            return ps.executeUpdate() > 0;
        }
    }

    private void unsetFocusGoals(int userId) throws SQLException {
        String sql = "UPDATE goals SET is_focus = 0 WHERE user_id = ?";
        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }

    private Goal mapResultSetToGoal(ResultSet rs) throws SQLException {
        return new Goal(
            rs.getInt("id"),
            rs.getInt("user_id"),
            rs.getString("title"),
            rs.getString("description"),
            rs.getInt("target_value"),
            rs.getInt("current_value"),
            rs.getString("category"),
            rs.getString("linked_habit"),
            rs.getInt("is_focus") == 1,
            rs.getString("created_at")
        );
    }
}
