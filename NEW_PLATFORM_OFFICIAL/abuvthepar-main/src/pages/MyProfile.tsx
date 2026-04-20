import { UserSettingsTab } from "@/components/settings/UserSettingsTab";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";

const MyProfile = () => {
  return (
    <main className="flex-1 overflow-auto bg-content">
      <div className="container mx-auto px-4 md:px-6 py-5 space-y-4">
        <MobileLogoHeader />
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        </div>
        <UserSettingsTab />
      </div>
    </main>
  );
};

export default MyProfile;
