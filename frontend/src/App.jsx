import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import Toast from './components/Toast';

function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('habitx_user');
    const savedToken = localStorage.getItem('habitx_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setPage('dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('habitx_user', JSON.stringify(userData));
    localStorage.setItem('habitx_token', userData.token);
    setPage('dashboard');
    addToast('success', `Welcome back, ${userData.name}! 🎉`);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    localStorage.setItem('habitx_user', JSON.stringify(userData));
    localStorage.setItem('habitx_token', userData.token);
    setPage('dashboard');
    addToast('success', `Account created! Welcome, ${userData.name}! 🚀`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('habitx_user');
    localStorage.removeItem('habitx_token');
    setPage('login');
    addToast('info', 'You have been logged out.');
  };

  const addToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {page === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigateRegister={() => setPage('register')}
          addToast={addToast}
        />
      )}
      {page === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onNavigateLogin={() => setPage('login')}
          addToast={addToast}
        />
      )}
      {page === 'dashboard' && (
        <DashboardPage
          user={user}
          onLogout={handleLogout}
          onNavigateGoals={() => setPage('goals')}
          addToast={addToast}
        />
      )}
      {page === 'goals' && (
        <GoalsPage
          user={user}
          onLogout={handleLogout}
          onBack={() => setPage('dashboard')}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}

export default App;
