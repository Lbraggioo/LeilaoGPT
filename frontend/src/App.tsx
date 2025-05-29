import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, AuthProvider } from './lib/context';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Importação de páginas
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50 dark:bg-slate-900">
        <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
          Carregando LeilãoGPT...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:conversationId" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
