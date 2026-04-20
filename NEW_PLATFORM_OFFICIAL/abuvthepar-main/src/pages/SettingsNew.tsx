import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Library, Settings as SettingsIcon, ClipboardCheck, ClipboardList, Layers, Shield, BarChart3, Rocket, Link2, Target, Award } from "lucide-react";
import { PlanTab } from "@/components/settings/PlanTab";
import { ResourcesTab } from "@/components/settings/ResourcesTab";
import { AdminSettingsTab } from "@/components/settings/AdminSettingsTab";
import { QuizzesTab } from "@/components/settings/QuizzesTab";
import { CustomerSuccessDashboard } from "@/components/settings/CustomerSuccessDashboard";
import { TierManagementTab } from "@/components/settings/TierManagementTab";
import { ChatModerationTab } from "@/components/settings/ChatModerationTab";
import { StatisticsTab } from "@/components/settings/StatisticsTab";
import { SprintManagementTab } from "@/components/settings/SprintManagementTab";
import { MyPlanTab } from "@/components/settings/MyPlanTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { MilestonesManagementTab } from "@/components/settings/MilestonesManagementTab";
import { BadgesManagementTab } from "@/components/settings/BadgesManagementTab";
import { AppVersionUpdateDialog } from "@/components/settings/AppVersionUpdateDialog";
import { ExpandableTabs, type TabItem } from "@/components/ui/expandable-tabs";
import { Loader2 } from "lucide-react";
import { APP_VERSION } from "@/config/version";

const SettingsNew = () => {
  const {
    roles,
    loading,
    isAdmin,
    isCSM,
    isExecutive,
  } = useRoleCheck();

  const getTabVisibility = (tabValue: string) => {
    if (isAdmin) return true;
    if (isCSM) return tabValue === 'customer-success';
    if (isExecutive) return tabValue === 'customer-success' || tabValue === 'statistics';
    return false;
  };

  const allTabs: (TabItem & { show: boolean })[] = [
    { id: 'customer-success', label: 'Users', icon: Users, color: 'text-blue-500', show: getTabVisibility('customer-success') },
    { id: 'tiers', label: 'Tiers', icon: Layers, color: 'text-indigo-500', show: getTabVisibility('tiers') },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, color: 'text-purple-500', show: getTabVisibility('statistics') },
    { id: 'plan', label: 'Courses', icon: BookOpen, color: 'text-emerald-500', show: getTabVisibility('plan') },
    { id: 'my-plan', label: 'My Roadmap', icon: ClipboardList, color: 'text-teal-500', show: getTabVisibility('plan') },
    { id: 'sprint', label: 'Sprint', icon: Rocket, color: 'text-cyan-500', show: getTabVisibility('sprint') },
    { id: 'quizzes', label: 'Quizzes', icon: ClipboardCheck, color: 'text-green-500', show: getTabVisibility('quizzes') },
    { id: 'milestones', label: 'Milestones', icon: Target, color: 'text-lime-500', show: getTabVisibility('milestones') },
    { id: 'badges', label: 'Badges', icon: Award, color: 'text-amber-500', show: getTabVisibility('badges') },
    { id: 'chat-moderation', label: 'Moderation', icon: Shield, color: 'text-orange-500', show: getTabVisibility('chat-moderation') },
    { id: 'integrations', label: 'Integrations', icon: Link2, color: 'text-red-500', show: getTabVisibility('integrations') },
  ];

  const visibleTabs = allTabs.filter(t => t.show);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'customer-success');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'customer-success': return <CustomerSuccessDashboard />;
      case 'tiers': return <TierManagementTab />;
      case 'statistics': return <StatisticsTab />;
      case 'plan': return <PlanTab />;
      case 'my-plan': return <MyPlanTab />;
      case 'sprint': return <SprintManagementTab />;
      case 'quizzes': return <QuizzesTab />;
      case 'milestones': return <MilestonesManagementTab />;
      case 'badges': return <BadgesManagementTab />;
      case 'chat-moderation': return <ChatModerationTab />;
      case 'integrations': return <IntegrationsTab />;
      case 'resources': return <ResourcesTab />;
      case 'content': return <AdminSettingsTab />;
      default: return <CustomerSuccessDashboard />;
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-content">
      <div className="container mx-auto px-4 md:px-6 py-5 space-y-4">
        <div className="flex-col flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">Admin</h1>
                <Badge variant="secondary" className="text-xs font-mono">
                  v{APP_VERSION}
                </Badge>
              </div>
            </div>
          </div>
          <AppVersionUpdateDialog />
        </div>

        <div className="flex justify-center">
          <ExpandableTabs
            tabs={visibleTabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </main>
  );
};

export default SettingsNew;
