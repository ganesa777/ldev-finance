import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { AnimatedBackground } from './components/layout/AnimatedBackground';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Lazy load setiap halaman agar ukuran awal JS di HP sangat kecil dan cepat
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback: React.FC = () => (
  <div className="space-y-4 py-2">
    <div className="h-24 rounded-3xl shimmer" />
    <div className="h-44 rounded-3xl shimmer" />
    <div className="h-64 rounded-3xl shimmer" />
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AnimatedBackground />
              <Suspense fallback={<PageFallback />}>
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
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
};

export default App;