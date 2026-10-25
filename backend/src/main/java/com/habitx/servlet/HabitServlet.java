package com.habitx.servlet;

import com.habitx.dao.HabitDAO;
import com.habitx.model.Habit;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import com.google.gson.JsonObject;

/**
 * Handles habit CRUD operations.
 * GET    /api/habits?date=YYYY-MM-DD  - List all habits with status for date (default: today)
 * POST   /api/habits                  - Add a new habit
 * DELETE /api/habits/{id}             - Delete a habit
 */
@WebServlet("/api/habits/*")
public class HabitServlet extends HttpServlet {

    private final HabitDAO habitDAO = new HabitDAO();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        // Resolve date param — default to today
        String date = resolveDate(req.getParameter("date"));

        try {
            List<Habit> habits = habitDAO.getHabitsForDate(userId, date);
            ServletUtils.sendSuccess(resp, habits);
        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Failed to fetch habits: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        try {
            JsonObject body = ServletUtils.parseBody(req);
            String habitName = body.has("habitName") ? body.get("habitName").getAsString().trim() : "";

            if (habitName.isEmpty()) {
                ServletUtils.sendError(resp, 400, "Habit name is required");
                return;
            }

            if (habitName.length() > 100) {
                ServletUtils.sendError(resp, 400, "Habit name must be under 100 characters");
                return;
            }

            Habit habit = habitDAO.addHabit(userId, habitName);
            if (habit != null) {
                ServletUtils.sendJson(resp, 201, Map.of("success", true, "data", habit));
            } else {
                ServletUtils.sendError(resp, 500, "Failed to create habit");
            }

        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        String idParam = ServletUtils.getPathParam(req);
        if (idParam == null) {
            ServletUtils.sendError(resp, 400, "Habit ID is required");
            return;
        }

        try {
            int habitId = Integer.parseInt(idParam);
            boolean deleted = habitDAO.deleteHabit(habitId, userId);
            if (deleted) {
                ServletUtils.sendSuccess(resp, Map.of("message", "Habit deleted successfully"));
            } else {
                ServletUtils.sendError(resp, 404, "Habit not found");
            }
        } catch (NumberFormatException e) {
            ServletUtils.sendError(resp, 400, "Invalid habit ID");
        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }

    private String resolveDate(String param) {
        if (param != null && param.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return param;
        }
        return LocalDate.now().format(DATE_FMT);
    }
}
