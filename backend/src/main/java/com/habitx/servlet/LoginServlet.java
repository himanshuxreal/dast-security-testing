package com.habitx.servlet;

import com.google.gson.JsonObject;
import com.habitx.dao.UserDAO;
import com.habitx.model.User;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Map;

/**
 * Handles user login.
 * POST /api/login
 */
@WebServlet("/api/login")
public class LoginServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject body = ServletUtils.parseBody(req);

            String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
            String password = body.has("password") ? body.get("password").getAsString() : "";

            if (email.isEmpty() || password.isEmpty()) {
                ServletUtils.sendError(resp, 400, "Email and password are required");
                return;
            }

            User user = userDAO.login(email, password);
            if (user != null) {
                // Create session
                HttpSession session = req.getSession(true);
                session.setAttribute("userId", user.getId());
                session.setAttribute("userName", user.getName());

                ServletUtils.sendSuccess(resp, Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "token", String.valueOf(user.getId())
                ));
            } else {
                ServletUtils.sendError(resp, 401, "Invalid email or password");
            }

        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
