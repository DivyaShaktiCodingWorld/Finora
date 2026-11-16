
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "./components/layout/AuthLayout";
import ProtectedRoute from "./components/routing/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BudgetPage from "./pages/BudgetPage";

import { useAuthStore } from "./store/authStore";

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
