import logoIcon from "@/assets/eec-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileLogoHeaderProps {
  className?: string;
}

export const MobileLogoHeader = ({ className = "" }: MobileLogoHeaderProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <img 
        src={logoIcon} 
        alt="Logo" 
        className="h-12 w-12 object-contain"
      />
    </div>
  );
};
