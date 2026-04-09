import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

import { API_BASE } from './utils/api';

/* ── Protected Route: redirects to /auth if not logged in ─────────────── */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('rsa_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

/* ── Auth Guard: redirects to /dashboard if already logged in ─────────── */
const AuthRoute = ({ children }) => {
  const token = localStorage.getItem('rsa_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  React.useEffect(() => {
    const token = localStorage.getItem('rsa_token');
    if (token) {
      axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data.success) {
          localStorage.setItem('rsa_user', JSON.stringify(res.data.data.user));
        }
      }).catch(err => {
        console.warn("Session invalid, logging out...", err);
        localStorage.removeItem('rsa_token');
        localStorage.removeItem('rsa_user');
        window.location.reload(); // Force re-route via AuthRoute/ProtectedRoute
      });
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
