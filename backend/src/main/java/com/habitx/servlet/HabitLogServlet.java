package com.habitx.servlet;

import com.google.gson.JsonObject;
import com.habitx.dao.HabitDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Handles habit log toggling.
 * POST /api/habits/log - Toggle a habit's completion for a given date (default: today)
 *   Body: { habitId: int, date?: "YYYY-MM-DD" }
 */
@WebServlet("/api/habits/log")
public class HabitLogServlet extends HttpServlet {

    private final HabitDAO habitDAO = new HabitDAO();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        try {
            JsonObject body = ServletUtils.parseBody(req);

            if (!body.has("habitId")) {
                ServletUtils.sendError(resp, 400, "Habit ID is required");
                return;
            }

            int habitId = body.get("habitId").getAsInt();

            // Resolve date — use provided date or today
            String date = LocalDate.now().format(DATE_FMT);
            if (body.has("date") && !body.get("date").isJsonNull()) {
                String provided = body.get("date").getAsString().trim();
                if (provided.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    date = provided;
                }
            }

            boolean completed = habitDAO.toggleHabitLogForDate(userId, habitId, date);

            ServletUtils.sendSuccess(resp, Map.of(
                "habitId", habitId,
                "date", date,
                "completed", completed,
                "message", completed ? "Habit marked as done!" : "Habit unmarked"
            ));

        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
