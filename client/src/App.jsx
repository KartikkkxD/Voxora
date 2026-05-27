import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthPage } from './pages/auth/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

/**
 * Main application component.
 * Configures client-side routing, protected auth guards, and global session stores.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Main Workspace Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect back to workspace */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

