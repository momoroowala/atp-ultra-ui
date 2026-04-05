import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeatureLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

export const FeatureLockedModal = ({ open, onOpenChange, featureName }: FeatureLockedModalProps) => {
  const { user } = useAuth();
  
  const { data: tierData } = useQuery({
    queryKey: ['user-tier-upsell', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tier_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError || !profile?.tier_id) return null;
      
      const { data: tier, error: tierError } = await supabase
        .from('tiers')
        .select('upsell_funnel_url')
        .eq('id', profile.tier_id)
        .maybeSingle();
      
      if (tierError) throw tierError;
      return tier;
    },
    enabled: !!user?.id && open,
  });

  const handleUnlock = () => {
    if (tierData?.upsell_funnel_url) {
      window.open(tierData.upsell_funnel_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Upgrade to Access {featureName}</DialogTitle>
          <DialogDescription className="text-center">
            This feature is not included in your current plan. Upgrade to unlock advanced trading tools and insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {tierData?.upsell_funnel_url && (
            <Button onClick={handleUnlock} className="w-full">
              Unlock
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
