# HabitX - Elite Habit Tracker

HabitX is a premium, high-performance web application designed to help users track their daily habits, maintain streaks, and visualize their progress. Built with a robust Java Servlet backend and a modern, responsive React frontend, HabitX offers a seamless and aesthetically pleasing user experience.

## 🎯 Problem Statement
In today's fast-paced world, maintaining consistency with personal goals and daily routines is challenging. Many existing habit trackers are either too complex, cluttered, or lack the visual appeal necessary to keep users engaged. 

**HabitX solves this by providing:**
- A frictionless, visually stunning interface (glassmorphism, dark mode).
- Immediate feedback on habit completions and streak tracking.
- A streamlined dashboard that visualizes weekly progress and daily completion percentages without overwhelming the user.

## 🏗️ Architecture
The application follows a decoupled client-server architecture:
1. **Frontend (SPA):** A React application built with Vite that handles the UI, routing, and state management. It communicates with the backend via RESTful HTTP requests using Axios.
2. **Backend (API):** A Java-based monolithic API using Jakarta Servlets. It exposes REST endpoints for user authentication, habit management, and dashboard statistics.
3. **Database Layer:** SQLite database accessed via standard JDBC, utilizing the Data Access Object (DAO) pattern to separate business logic from database operations.

## 🛠️ Technologies Used

### Backend
* **Java 17:** Core programming language.
* **Jakarta Servlet API (6.0.0):** Lightweight web framework for handling HTTP requests.
* **Apache Maven:** Dependency management and build tool.
* **Apache Tomcat (10.x):** Embedded web server running via Cargo Maven plugin.
* **SQLite (JDBC):** Embedded relational database for lightweight, persistent storage.
* **jBCrypt:** Secure password hashing for user authentication.
* **Gson:** Serialization and deserialization of JSON payloads.

### Frontend
* **React (19.x):** Component-based UI library.
* **Vite:** Extremely fast build tool and development server.
* **Axios:** Promise-based HTTP client for API communication.
* **Vanilla CSS:** Custom-built styling featuring modern design tokens, CSS variables, and glassmorphism (no bulky CSS frameworks).

## 📂 Folder Structure

```text
HABIT TRACKER/
├── backend/                  # Java API Server
│   ├── src/main/java/com/habitx/
│   │   ├── dao/              # Data Access Objects (UserDAO, HabitDAO)
│   │   ├── db/               # Database initialization and connection (DatabaseManager)
│   │   ├── model/            # Plain Old Java Objects (User, Habit, HabitLog)
│   │   └── servlet/          # API Endpoints (LoginServlet, HabitServlet, CorsFilter)
│   ├── src/main/webapp/      # Web application configuration (web.xml)
│   ├── pom.xml               # Maven dependencies and build plugins
│   └── habitx.db             # SQLite database file (auto-generated)
│
└── frontend/                 # React Client Application
    ├── public/               # Static assets
    ├── src/
    │   ├── api/              # Axios configuration and interceptors (axios.js)
    │   ├── components/       # Reusable UI components (HabitCard, ProgressBar, Toast)
    │   ├── pages/            # Application views (DashboardPage, LoginPage, RegisterPage)
    │   ├── App.jsx           # Main application wrapper and state manager
    │   ├── main.jsx          # React entry point
    │   └── index.css         # Global styles and design system variables
    ├── package.json          # NPM dependencies and scripts
    └── vite.config.js        # Vite configuration
```

## 🚀 Execution Flow & Setup

### 1. Starting the Backend
The backend utilizes the Cargo Maven plugin to run an embedded Tomcat server.
1. Navigate to the `backend` directory.
2. Run the command: `mvn cargo:run`
3. The database (`habitx.db`) will automatically initialize.
4. The API will be available at `http://localhost:9090/api/`.

### 2. Starting the Frontend
The frontend uses Vite for ultra-fast hot module replacement.
1. Navigate to the `frontend` directory.
2. Install dependencies (first time only): `npm install`
3. Run the development server: `npm run dev`
4. The application will be accessible at `http://localhost:5173`.

### User Flow:
1. **Authentication:** User visits the app and either registers a new account or logs in. Credentials are hashed using BCrypt. A token (user ID) is stored in local storage.
2. **Dashboard:** Upon login, the React app fetches dashboard stats (`/api/dashboard`) and the user's habits (`/api/habits`).
3. **Tracking:** User toggles a habit. The frontend instantly updates the UI optimistically, while sending a POST request to `/api/habits/log`.
4. **Data Persistence:** The backend DAO registers the completion status for the *current date* in SQLite, ensuring streaks are accurately tracked day-to-day.

## 🚧 Problems Faced & Solutions

1. **CORS (Cross-Origin Resource Sharing):**
   * *Problem:* The React app running on port 5173 was blocked from making API requests to the Tomcat server on port 9090 by the browser's security policies.
   * *Solution:* Implemented a custom `CorsFilter` implementing `jakarta.servlet.Filter` to dynamically append `Access-Control-Allow-Origin` and related headers to all incoming requests, including handling preflight `OPTIONS` requests.

2. **Daily Reset & Habit Persistence:**
   * *Problem:* Initially, tracking habits globally meant checking a habit marked it as "done" forever. We needed a way to reset habits daily while retaining historical data for streaks.
   * *Solution:* Implemented a `habit_logs` table with a composite unique constraint on `(habit_id, date)`. The `HabitLogServlet` toggles the status specifically for the current `LocalDate`, allowing the dashboard to cleanly calculate streaks without overwriting past data.

3. **Vanilla CSS Modularity & Theming:**
   * *Problem:* Maintaining a consistent "premium dark mode" aesthetic across components without a framework like Tailwind can lead to messy, repetitive CSS.
   * *Solution:* Established a robust Design System within `index.css` using CSS custom properties (`:root`). By defining specific color palettes (surface, primary, text), spacing, and glassmorphism utilities globally, components remain clean and highly reusable.
