package com.habitx.servlet;

import com.habitx.dao.HabitDAO;
import com.habitx.dao.UserDAO;
import com.habitx.model.User;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Provides dashboard statistics.
 * GET /api/dashboard?date=YYYY-MM-DD  (default: today)
 */
@WebServlet("/api/dashboard")
public class DashboardServlet extends HttpServlet {

    private final HabitDAO habitDAO = new HabitDAO();
    private final UserDAO userDAO = new UserDAO();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        // Resolve date
        String dateParam = req.getParameter("date");
        String date = (dateParam != null && dateParam.matches("\\d{4}-\\d{2}-\\d{2}"))
                ? dateParam
                : LocalDate.now().format(DATE_FMT);

        LocalDate localDate = LocalDate.parse(date, DATE_FMT);
        String displayDate = localDate.format(DISPLAY_FMT);
        String todayStr = LocalDate.now().format(DATE_FMT);

        try {
            User user = userDAO.getUserById(userId);
            if (user == null) {
                ServletUtils.sendError(resp, 404, "User not found");
                return;
            }

            HabitDAO.DashboardStats stats = habitDAO.getDashboardStatsForDate(userId, date);

            // Use HashMap to avoid Map.of() 10-key limit
            Map<String, Object> payload = new HashMap<>();
            payload.put("userName", user.getName());
            payload.put("date", displayDate);
            payload.put("selectedDate", date);
            payload.put("isToday", date.equals(todayStr));
            payload.put("totalHabits", stats.totalHabits);
            payload.put("completedToday", stats.completedToday);
            payload.put("totalCompleted", stats.totalCompleted);
            payload.put("bestStreak", stats.bestStreak);
            payload.put("completionPercentage", stats.completionPercentage);
            payload.put("weeklyData", stats.weeklyData);
            payload.put("weeklyLabels", stats.weeklyLabels);
            payload.put("weeklyDates", stats.weeklyDates);
            payload.put("selectedDayIndex", stats.selectedDayIndex);

            ServletUtils.sendSuccess(resp, payload);

        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
