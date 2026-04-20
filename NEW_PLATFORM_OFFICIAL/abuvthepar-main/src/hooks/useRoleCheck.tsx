import { useAuth } from './useAuth';

export const useRoleCheck = () => {
  const { roles, loading, isAdmin, pageVisibility } = useAuth();

  const canAccessPage = (pageKey: string) => {
    return pageVisibility[pageKey as keyof typeof pageVisibility] === true;
  };

  return {
    roles,
    loading,
    isClient: roles.includes('client'),
    isAdmin,
    isMegaAdmin: roles.includes('mega_admin'),
    isCSM: roles.includes('csm') || roles.includes('csa'),
    isCSA: roles.includes('csa'),
    isExecutive: roles.includes('executive'),
    canAccessAdminPanel: pageVisibility.admin_panel,
    canAccessPage,
    hasRole: (role: string) => roles.includes(role),
    hasAnyRole: (checkRoles: string[]) => checkRoles.some(r => roles.includes(r)),
  };
};
