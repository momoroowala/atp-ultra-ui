import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LoaderShimmer } from './LoaderShimmer';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // On GitHub Pages (static deploy), bypass auth -- it's a demo
  if (import.meta.env.BASE_URL !== '/') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderShimmer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};