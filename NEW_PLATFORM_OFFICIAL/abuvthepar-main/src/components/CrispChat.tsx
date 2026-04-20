import { useEffect } from "react";

// Crisp chat is temporarily disabled
// To re-enable, restore the original implementation from version control
export const CrispChat = () => {
  useEffect(() => {
    // Hide Crisp if it was previously loaded
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:hide"]);
    }
  }, []);

  return null;
};
