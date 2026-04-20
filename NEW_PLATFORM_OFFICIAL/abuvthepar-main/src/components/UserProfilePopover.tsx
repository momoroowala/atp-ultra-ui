import { type ReactNode } from 'react';
import { useProfileDrawer } from '@/contexts/ProfileDrawerContext';
import { useRoleCheck } from '@/hooks/useRoleCheck';

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
}

export const UserProfilePopover = ({ userId, children }: UserProfilePopoverProps) => {
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const { openProfileDrawer } = useProfileDrawer();

  if (!isStaff || !userId) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      className="cursor-pointer text-left inline-flex items-center"
      onClick={(e) => {
        e.stopPropagation();
        openProfileDrawer(userId);
      }}
    >
      {children}
    </button>
  );
};
