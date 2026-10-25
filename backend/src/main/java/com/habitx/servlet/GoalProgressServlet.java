package com.habitx.servlet;

import com.habitx.dao.GoalDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/goals/progress")
public class GoalProgressServlet extends HttpServlet {
    private final GoalDAO goalDAO = new GoalDAO();

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int userId = ServletUtils.getUserId(req);
            if (userId == -1) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            JsonObject json = ServletUtils.parseBody(req);
            if (json == null || !json.has("id") || !json.has("currentValue")) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing id or currentValue");
                return;
            }

            int goalId = json.get("id").getAsInt();
            int currentValue = json.get("currentValue").getAsInt();

            if (currentValue < 0) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Progress value cannot be negative");
                return;
            }

            boolean success = goalDAO.updateProgress(goalId, userId, currentValue);
            if (success) {
                JsonObject response = new JsonObject();
                response.addProperty("message", "Progress updated");
                response.addProperty("currentValue", currentValue);
                ServletUtils.sendJson(resp, HttpServletResponse.SC_OK, response);
            } else {
                ServletUtils.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Goal not found or unauthorized");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            ServletUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }
}
