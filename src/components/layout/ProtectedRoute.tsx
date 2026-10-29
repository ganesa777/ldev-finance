import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full text-center">
          <div className="w-14 h-14 rounded-full grad-sky flex items-center justify-center text-white shadow-float animate-pulse">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-2 w-full">
            <div className="h-4 w-32 mx-auto rounded-full shimmer" />
            <div className="h-3 w-48 mx-auto rounded-full shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};