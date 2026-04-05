import { useAppVersionChecker } from "@/hooks/useAppVersionChecker";
import { AppUpdateModal } from "./AppUpdateModal";

export const AppVersionChecker = () => {
  const { showModal, onClose } = useAppVersionChecker();

  if (!showModal) return null;

  return (
    <AppUpdateModal
      open={showModal}
      onClose={onClose}
    />
  );
};
