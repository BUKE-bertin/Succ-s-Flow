import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "./layouts/AppLayout";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Subjects } from "./pages/Subjects";
import { Chapters } from "./pages/Chapters";
import { Planner } from "./pages/Planner";
import { Focus } from "./pages/Focus";
import { Stats } from "./pages/Stats";

const App = () => {
  return (
    <BrowserRouter>
        {/* Global Toast Notification System */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fafafa",
              border: "1px solid #27272a",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />

        <Routes>
          {/* Auth Route */}
          <Route path="/auth" element={<Auth />} />

          {/* Core Application Protected Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="chapters" element={<Chapters />} />
            <Route path="planner" element={<Planner />} />
            <Route path="focus" element={<Focus />} />
            <Route path="stats" element={<Stats />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
};

export default App;
