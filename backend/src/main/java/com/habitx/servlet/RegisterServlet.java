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
 * Handles user registration.
 * POST /api/register
 */
@WebServlet("/api/register")
public class RegisterServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject body = ServletUtils.parseBody(req);

            String name = body.has("name") ? body.get("name").getAsString().trim() : "";
            String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
            String password = body.has("password") ? body.get("password").getAsString() : "";

            // Validation
            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                ServletUtils.sendError(resp, 400, "All fields are required");
                return;
            }

            if (password.length() < 6) {
                ServletUtils.sendError(resp, 400, "Password must be at least 6 characters");
                return;
            }

            if (!email.matches("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
                ServletUtils.sendError(resp, 400, "Invalid email format");
                return;
            }

            // Check if email exists
            if (userDAO.emailExists(email)) {
                ServletUtils.sendError(resp, 409, "Email already registered");
                return;
            }

            // Register user
            User user = userDAO.register(name, email, password);
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
                ServletUtils.sendError(resp, 500, "Registration failed");
            }

        } catch (SQLException e) {
            ServletUtils.sendError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
