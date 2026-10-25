package com.habitx.servlet;

import com.habitx.dao.HabitDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * Provides rich analytics data for dashboard charts.
 * GET /api/analytics
 */
@WebServlet("/api/analytics")
public class AnalyticsServlet extends HttpServlet {

    private final HabitDAO habitDAO = new HabitDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int userId = ServletUtils.getUserId(req);
        if (userId == -1) {
            ServletUtils.sendError(resp, 401, "Authentication required");
            return;
        }

        try {
            HabitDAO.AnalyticsData data = habitDAO.getAnalyticsData(userId);
            ServletUtils.sendSuccess(resp, data);
        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
