import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { AnimatedBackground } from './components/layout/AnimatedBackground';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AnimatedBackground />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Dashboard />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transaksi"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Transactions />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/laporan"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Reports />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pengaturan"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Settings />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <NotFound />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
};

export default App;