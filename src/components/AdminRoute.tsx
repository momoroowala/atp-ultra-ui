import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { LoaderShimmer } from './LoaderShimmer';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { canAccessAdminPanel, loading } = useRoleCheck();

  if (loading) {
    return <LoaderShimmer />;
  }

  if (!canAccessAdminPanel) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
