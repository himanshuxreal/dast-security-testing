package com.habitx.servlet;

import com.habitx.dao.GoalDAO;
import com.habitx.model.Goal;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.google.gson.JsonObject;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/api/goals")
public class GoalServlet extends HttpServlet {
    private final GoalDAO goalDAO = new GoalDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int userId = ServletUtils.getUserId(req);
            if (userId == -1) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            String category = req.getParameter("category");
            List<Goal> goals;

            if (category != null && !category.isEmpty()) {
                // Validate category
                if (!category.equals("weekly") && !category.equals("monthly") && !category.equals("yearly")) {
                    ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid category. Must be weekly, monthly, or yearly.");
                    return;
                }
                goals = goalDAO.getGoalsByCategory(userId, category);
            } else {
                goals = goalDAO.getGoalsByUserId(userId);
            }

            ServletUtils.sendJson(resp, HttpServletResponse.SC_OK, goals);

        } catch (SQLException e) {
            e.printStackTrace();
            ServletUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int userId = ServletUtils.getUserId(req);
            if (userId == -1) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            JsonObject json = ServletUtils.parseBody(req);
            if (json == null || !json.has("title") || !json.has("targetValue") || !json.has("category")) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing required fields");
                return;
            }

            String category = json.get("category").getAsString();
            if (!category.equals("weekly") && !category.equals("monthly") && !category.equals("yearly")) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid category. Must be weekly, monthly, or yearly.");
                return;
            }

            Goal newGoal = new Goal();
            newGoal.setUserId(userId);
            newGoal.setTitle(json.get("title").getAsString());
            newGoal.setDescription(json.has("description") ? json.get("description").getAsString() : "");
            newGoal.setTargetValue(json.get("targetValue").getAsInt());
            newGoal.setCurrentValue(json.has("currentValue") ? json.get("currentValue").getAsInt() : 0);
            newGoal.setCategory(category);
            newGoal.setLinkedHabit(json.has("linkedHabit") ? json.get("linkedHabit").getAsString() : "");
            newGoal.setFocus(json.has("isFocus") && json.get("isFocus").getAsBoolean());

            Goal created = goalDAO.createGoal(newGoal);
            ServletUtils.sendJson(resp, HttpServletResponse.SC_CREATED, created);

        } catch (SQLException e) {
            e.printStackTrace();
            ServletUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int userId = ServletUtils.getUserId(req);
            if (userId == -1) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            JsonObject json = ServletUtils.parseBody(req);
            if (json == null || !json.has("id")) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing goal id");
                return;
            }

            Goal goal = new Goal();
            goal.setId(json.get("id").getAsInt());
            goal.setUserId(userId);
            goal.setTitle(json.get("title").getAsString());
            goal.setDescription(json.has("description") ? json.get("description").getAsString() : "");
            goal.setTargetValue(json.get("targetValue").getAsInt());
            goal.setCurrentValue(json.get("currentValue").getAsInt());
            goal.setCategory(json.get("category").getAsString());
            goal.setLinkedHabit(json.has("linkedHabit") ? json.get("linkedHabit").getAsString() : "");
            goal.setFocus(json.has("isFocus") && json.get("isFocus").getAsBoolean());

            boolean success = goalDAO.updateGoal(goal);
            if (success) {
                ServletUtils.sendJson(resp, HttpServletResponse.SC_OK, goal);
            } else {
                ServletUtils.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Goal not found or unauthorized");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            ServletUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int userId = ServletUtils.getUserId(req);
            if (userId == -1) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            String idParam = req.getParameter("id");
            if (idParam == null) {
                ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing goal id");
                return;
            }

            int goalId = Integer.parseInt(idParam);
            boolean success = goalDAO.deleteGoal(goalId, userId);

            if (success) {
                JsonObject response = new JsonObject();
                response.addProperty("message", "Goal deleted");
                ServletUtils.sendJson(resp, HttpServletResponse.SC_OK, response);
            } else {
                ServletUtils.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Goal not found or unauthorized");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            ServletUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        } catch (NumberFormatException e) {
            ServletUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid goal id");
        }
    }
}
