import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCommunityChannels } from '@/hooks/useCommunityChannels';
import { useTiers } from '@/hooks/useTiers';
import { CHANNEL_ICON_OPTIONS } from '@/constants/channelIcons';
import { X, Hash, ArrowRight, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}



export const CreateChannelModal = ({ open, onOpenChange }: CreateChannelModalProps) => {
  const { createChannel } = useCommunityChannels();
  const { data: tiers } = useTiers();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('#️⃣');
  const [visibleToAll, setVisibleToAll] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createChannel.mutate({
      name,
      description: description || undefined,
      icon_emoji: icon,
      visible_tier_ids: visibleToAll ? undefined : selectedTierIds,
      is_read_only: isReadOnly,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('#️⃣');
    setVisibleToAll(true);
    setIsReadOnly(false);
    setSelectedTierIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Create Channel</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Channel Icon Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Channel Icon</Label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
              {CHANNEL_ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "w-12 h-12 text-xl rounded-xl flex items-center justify-center transition-all",
                    icon === emoji 
                      ? "bg-primary/10 border-2 border-primary" 
                      : "bg-muted border border-border hover:border-primary/50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., general, announcements"
              required
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Visibility Checkbox */}
          <div className="flex items-center gap-3 py-2">
            <Checkbox
              id="visible-to-all"
              checked={visibleToAll}
              onCheckedChange={(checked) => {
                setVisibleToAll(checked === true);
                if (checked) setSelectedTierIds([]);
              }}
              className="h-5 w-5 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="visible-to-all" className="text-sm font-medium cursor-pointer">
              Visible to all tiers
            </Label>
          </div>

          {/* Tier Selection */}
          {tiers && tiers.length > 0 && (
            <div className={cn("space-y-2 pl-8", visibleToAll && "opacity-50")}>
              <Label className="text-xs text-muted-foreground">Select tiers:</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tiers.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`tier-${tier.id}`}
                      checked={selectedTierIds.includes(tier.id)}
                      disabled={visibleToAll}
                      onCheckedChange={(checked) => {
                        setSelectedTierIds(prev =>
                          checked
                            ? [...prev, tier.id]
                            : prev.filter(id => id !== tier.id)
                        );
                      }}
                      className="h-4 w-4 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`tier-${tier.id}`} className="text-sm cursor-pointer">
                      {tier.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Read-only (Announcement) Checkbox */}
          <div className="flex items-center gap-3 py-2">
            <Checkbox
              id="read-only"
              checked={isReadOnly}
              onCheckedChange={(checked) => setIsReadOnly(checked === true)}
              className="h-5 w-5 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="read-only" className="text-sm font-medium cursor-pointer">
                Read-only (Announcement channel)
              </Label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
              className="flex-1 h-12 text-white"
              style={{ background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A' }}
            >
              {createChannel.isPending ? 'Creating...' : (
                <>
                  Create Channel
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
