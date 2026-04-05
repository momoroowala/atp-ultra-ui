import { useAuth } from './useAuth';

export const useAdminCheck = () => {
  const { isAdmin, adminLoading } = useAuth();
  
  return { isAdmin, loading: adminLoading };
};