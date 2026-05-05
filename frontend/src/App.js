import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import DashboardLayout from "@/pages/DashboardLayout";
import Opportunities from "@/pages/Opportunities";
import Watchlist from "@/pages/Watchlist";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/app"
            element={
              <Protected>
                <DashboardLayout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/app/opportunities" replace />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F4F4F5",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
