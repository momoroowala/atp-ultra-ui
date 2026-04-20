import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthCache } from '@/services/ticketApi';
import { useQuery } from '@tanstack/react-query';

export type FeatureAccess = Record<string, boolean>;

export type FeatureVisibility = {
  crisp_chat_visible: boolean;
  [key: string]: boolean;
};

export type PageVisibility = {
  home: boolean;
  courses: boolean;
  my_plan: boolean;
  calendar: boolean;
  community: boolean;
  one_on_ones: boolean;
  support: boolean;
  admin_panel: boolean;
  support_tickets: boolean;
  csm_panel: boolean;
  brand_leads: boolean;
  my_notes: boolean;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminLoading: boolean;
  roles: string[];
  isAdmin: boolean;
  featureAccess: FeatureAccess | null;
  featureVisibility: FeatureVisibility | null;
  pageVisibility: PageVisibility;
  signOut: () => Promise<void>;
}

const defaultPageVisibility: PageVisibility = {
  home: true,
  courses: true,
  my_plan: true,
  calendar: true,
  community: true,
  one_on_ones: false,
  support: true,
  admin_panel: false,
  support_tickets: false,
  csm_panel: false,
  brand_leads: false,
  my_notes: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // GitHub Pages demo: return fake admin user so dashboard populates
  if (import.meta.env.BASE_URL !== '/') {
    const fakeUser = { id: 'demo-admin-001', email: 'mo@test.dev', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2025-01-01' } as unknown as User;
    const allPages: PageVisibility = { home: true, courses: true, my_plan: true, calendar: true, community: true, one_on_ones: true, support: true, admin_panel: true, support_tickets: true, csm_panel: true, brand_leads: true, my_notes: true };
    const demoValue: AuthContextType = {
      user: fakeUser, session: null, loading: false, adminLoading: false,
      roles: ['mega_admin', 'admin', 'csm'], isAdmin: true, featureAccess: {},
      featureVisibility: { crisp_chat_visible: false }, pageVisibility: allPages,
      signOut: async () => {},
    };
    return <AuthContext.Provider value={demoValue}>{children}</AuthContext.Provider>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [featureVisibility, setFeatureVisibility] = useState<FeatureVisibility | null>(null);
  const [pageVisibility, setPageVisibility] = useState<PageVisibility>(defaultPageVisibility);

  // Use React Query to fetch user roles and features
  const { data: userRolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRolesAndFeatures', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id, roles(role_key, page_visibility), tier_id, tiers(feature_access, feature_visibility, page_visibility)')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update roles and features when data changes
  useEffect(() => {
    if (!userRolesData) {
      setRoles([]);
      setIsAdmin(false);
      setFeatureAccess(null);
      setFeatureVisibility(null);
      setPageVisibility(defaultPageVisibility);
      setAdminLoading(false);
      return;
    }

    const roleData = Array.isArray(userRolesData?.roles) ? userRolesData.roles[0] : userRolesData?.roles;
    const roleKey = roleData?.role_key || '';
    setRoles(roleKey ? [roleKey] : []);
    setIsAdmin(roleKey === 'admin' || roleKey === 'mega_admin');

    // Set feature access from tier - merge with defaults to handle missing keys
    const tierData = Array.isArray(userRolesData?.tiers) ? userRolesData.tiers[0] : userRolesData?.tiers;
    const defaultFeatureAccess: FeatureAccess = {};
    if (tierData?.feature_access) {
      setFeatureAccess({ ...defaultFeatureAccess, ...(tierData.feature_access as Partial<FeatureAccess>) });
    } else {
      setFeatureAccess(defaultFeatureAccess);
    }

    // Set feature visibility from tier - merge with defaults to handle missing keys
    const defaultFeatureVisibility: FeatureVisibility = {
      crisp_chat_visible: true,
    };
    if (tierData?.feature_visibility) {
      setFeatureVisibility({ ...defaultFeatureVisibility, ...(tierData.feature_visibility as Partial<FeatureVisibility>) });
    } else {
      setFeatureVisibility(defaultFeatureVisibility);
    }

    // Merge page visibility from role and tier (OR logic)
    const rolePageVis = (roleData?.page_visibility || {}) as Partial<PageVisibility>;
    const tierPageVis = (tierData?.page_visibility || {}) as Partial<PageVisibility>;
    const mergedPageVis: PageVisibility = { ...defaultPageVisibility };
    for (const key of Object.keys(defaultPageVisibility) as (keyof PageVisibility)[]) {
      mergedPageVis[key] = (rolePageVis[key] === true) || (tierPageVis[key] === true);
    }
    setPageVisibility(mergedPageVis);

    setAdminLoading(false);
  }, [userRolesData]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        clearAuthCache();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session?.user) {
          setRoles([]);
          setIsAdmin(false);
          setFeatureAccess(null);
          setFeatureVisibility(null);
          setPageVisibility(defaultPageVisibility);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    
    setUser(null);
    setSession(null);
    setRoles([]);
    setIsAdmin(false);
    setFeatureAccess(null);
    setFeatureVisibility(null);
    setPageVisibility(defaultPageVisibility);
  };

  const value = {
    user,
    session,
    loading,
    adminLoading,
    roles,
    isAdmin,
    featureAccess,
    featureVisibility,
    pageVisibility,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
