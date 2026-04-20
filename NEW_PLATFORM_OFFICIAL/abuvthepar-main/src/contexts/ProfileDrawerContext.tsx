import React, { createContext, useContext, useState, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// Lazy import to avoid circular deps
const LazyUserDetailsView = React.lazy(() =>
  import('@/components/settings/customer-success/UserDetailsView').then(mod => ({
    default: mod.UserDetailsView,
  }))
);

interface ProfileDrawerContextType {
  openProfileDrawer: (userId: string) => void;
  closeProfileDrawer: () => void;
}

const ProfileDrawerContext = createContext<ProfileDrawerContextType | null>(null);

export const useProfileDrawer = () => {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) throw new Error('useProfileDrawer must be used within ProfileDrawerProvider');
  return ctx;
};

export const ProfileDrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);

  const openProfileDrawer = useCallback((id: string) => setUserId(id), []);
  const closeProfileDrawer = useCallback(() => setUserId(null), []);

  return (
    <ProfileDrawerContext.Provider value={{ openProfileDrawer, closeProfileDrawer }}>
      {children}
      <Sheet open={!!userId} onOpenChange={(open) => { if (!open) closeProfileDrawer(); }}>
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0 overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Student Profile</SheetTitle>
          </VisuallyHidden>
          {userId && (
            <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading profile…</div>}>
              <LazyUserDetailsView
                userId={userId}
                onBack={closeProfileDrawer}
              />
            </React.Suspense>
          )}
        </SheetContent>
      </Sheet>
    </ProfileDrawerContext.Provider>
  );
};
