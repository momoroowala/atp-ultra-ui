import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Target, Zap } from "lucide-react";
interface Bookmark {
  title: string;
  url: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  description: string;
  target: string;
}
const bookmarks: Bookmark[] = [{
  title: "Discord",
  url: "https://discord.com/channels/1128724562708799619/1128724563283427492",
  icon: MessageCircle,
  description: "Join the community",
  target: "_blank"
}, {
  title: "Courses",
  url: "/courses",
  icon: Target,
  description: "Access course materials",
  target: ""
}, {
  title: "Apex (Code: CASPER)",
  url: "https://apextraderfunding.com",
  icon: Zap,
  description: "Get funded",
  target: "_blank"
}];
export const BookmarksPanel = () => {
  return null;
};