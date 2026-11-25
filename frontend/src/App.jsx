import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login          from "./pages/Auth/Login";
import SignUp         from "./pages/Auth/SignUp";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword  from "./pages/Auth/ResetPassword";
import Home           from "./pages/Dashboard/Home";
import Income         from "./pages/Dashboard/Income";
import Expense        from "./pages/Dashboard/Expense";

// Redirects to /login if the user is not authenticated.
// Shows nothing while auth state is being resolved (avoids flash).
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

// Redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    <Route
      path="/login"
      element={<PublicRoute><Login /></PublicRoute>}
    />
    <Route
      path="/signUp"
      element={<PublicRoute><SignUp /></PublicRoute>}
    />
    <Route
      path="/forgot-password"
      element={<PublicRoute><ForgotPassword /></PublicRoute>}
    />
    <Route
      path="/reset-password/:token"
      element={<PublicRoute><ResetPassword /></PublicRoute>}
    />

    <Route
      path="/dashboard"
      element={<PrivateRoute><Home /></PrivateRoute>}
    />
    <Route
      path="/income"
      element={<PrivateRoute><Income /></PrivateRoute>}
    />
    <Route
      path="/expense"
      element={<PrivateRoute><Expense /></PrivateRoute>}
    />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "13px" },
          success: { duration: 3000 },
          error:   { duration: 4000 },
        }}
      />
    </Router>
  </AuthProvider>
);

export default App;
