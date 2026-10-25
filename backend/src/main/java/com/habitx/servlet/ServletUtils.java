package com.habitx.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * Utility class for common servlet operations.
 */
public class ServletUtils {

    private static final Gson GSON = new Gson();

    /**
     * Parse request body as JSON object.
     */
    public static JsonObject parseBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return GSON.fromJson(sb.toString(), JsonObject.class);
    }

    /**
     * Send a JSON response with the given status code and data.
     */
    public static void sendJson(HttpServletResponse resp, int status, Object data) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        try (PrintWriter pw = resp.getWriter()) {
            pw.write(GSON.toJson(data));
        }
    }

    /**
     * Send a success JSON response.
     */
    public static void sendSuccess(HttpServletResponse resp, Object data) throws IOException {
        sendJson(resp, 200, Map.of("success", true, "data", data));
    }

    /**
     * Send an error JSON response.
     */
    public static void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        sendJson(resp, status, Map.of("success", false, "error", message));
    }

    /**
     * Get the authenticated user ID from the session.
     * Returns -1 if not authenticated.
     */
    public static int getUserId(HttpServletRequest req) {
        // Check session
        var session = req.getSession(false);
        if (session != null) {
            Object userId = session.getAttribute("userId");
            if (userId != null) {
                return (int) userId;
            }
        }

        // Check Authorization header (token-based)
        String authHeader = req.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                return Integer.parseInt(authHeader.substring(7));
            } catch (NumberFormatException e) {
                return -1;
            }
        }

        return -1;
    }

    /**
     * Extract path parameter from URL (e.g., /api/habits/5 → "5").
     */
    public static String getPathParam(HttpServletRequest req) {
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.length() > 1) {
            return pathInfo.substring(1);
        }
        return null;
    }
}
