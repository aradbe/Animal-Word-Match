

import { HashRouter, Routes, Route } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import GameStartPage from "../pages/GameStartPage";
import GameRoundPage from "../pages/GameRoundPage";
import ResultsPage from "../pages/ResultsPage";
import ProgressPage from "../pages/ProgressPage";
import AdminPage from "../pages/AdminPage";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import NotFoundPage from "../pages/NotFoundPage";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />

        <Route path="/game" element={<GameStartPage />} />
        <Route path="/game/play" element={<GameRoundPage />} />
        <Route path="/results" element={<ResultsPage />} />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}

export default AppRouter;