import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <header>
        <h1>Welcome, {user?.username}</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
