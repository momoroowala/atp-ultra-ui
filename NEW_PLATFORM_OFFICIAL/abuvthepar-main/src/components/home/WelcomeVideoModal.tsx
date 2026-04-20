import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


const STORAGE_KEY = "onboarding_video_watched";

interface WelcomeVideoModalProps {
  onDismiss: () => void;
}

export const WelcomeVideoModal = ({ onDismiss }: WelcomeVideoModalProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const watched = localStorage.getItem(STORAGE_KEY);
    if (!watched) {
      setOpen(true);
    } else {
      onDismiss();
    }
  }, [onDismiss]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-primary/20">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl font-bold text-center">
            Welcome to Above The Par! 🎉
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Watch this quick intro to see how everything works.
          </p>
        </DialogHeader>

        <div className="px-6">
          <div className="relative w-full aspect-video rounded-xl bg-muted/60 border border-border overflow-hidden">
            <iframe
              className="w-full h-full"
              src="https://player.vimeo.com/video/1167826599?h=06a58c7429&autoplay=1"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        </div>

        <div className="p-6 pt-4 flex justify-center">
          <Button size="lg" className="px-10 text-base" onClick={handleDismiss}>
            Got it, let's go! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const hasWatchedWelcomeVideo = () =>
  localStorage.getItem(STORAGE_KEY) === "true";
