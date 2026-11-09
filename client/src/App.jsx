import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ComponentDetail from "./components/ComponentDetail.jsx";
import "./App.css";

const AnalyticsDashboard = lazy(
  () => import("./components/analytics/AnalyticsDashboard.jsx")
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/analytics"
            element={
              <Suspense
                fallback={
                  <p className="empty-copy">Loading analytics…</p>
                }
              >
                <AnalyticsDashboard />
              </Suspense>
            }
          />
        </Route>
        <Route path="/components/:id" element={<ComponentDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
