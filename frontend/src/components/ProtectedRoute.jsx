import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h3>Loading system...</h3>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (user.role !== 'admin' && !allowedRoles.includes(user.role)) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#c0392b' }}>
          <h2>Access Denied</h2>
          <p>You do not have administrative permission to view this section.</p>
        </div>
      );
    }
  }

  return children;
};
