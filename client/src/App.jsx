import React from 'react';
import { Home } from './pages/Home';
import { AuthProvider } from './context/AuthContext';

/**
 * Main application component.
 * Renders the Home page workspace with Supabase Authentication context.
 */
function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}

export default App;

