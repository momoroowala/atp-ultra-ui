import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { APP_VERSION } from "@/config/version";
import { supabase } from "@/integrations/supabase/client";

const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const useAppVersionChecker = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const checkVersion = useCallback(async () => {
    if (!user) return;

    // Don't show modal more than once per session for the same version mismatch
    const sessionKey = `version_modal_shown_${APP_VERSION}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      const { data, error } = await supabase
        .from('app_version')
        .select('version')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking app version:', error);
        return;
      }

      const dbVersion = data?.version;
      setLatestVersion(dbVersion || null);

      // Only show modal if DB version is NEWER than local version
      // ISO timestamps are lexicographically sortable, so string comparison works
      if (dbVersion && dbVersion > APP_VERSION) {
        setShowModal(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (err) {
      console.error('Error in version check:', err);
    }
  }, [user]);

  // Initial check and polling
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkVersion();

    // Set up polling every 10 minutes
    const intervalId = setInterval(checkVersion, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, checkVersion]);

  const handleClose = () => {
    setShowModal(false);
  };

  return {
    showModal,
    currentVersion: APP_VERSION,
    latestVersion,
    onClose: handleClose,
  };
};
