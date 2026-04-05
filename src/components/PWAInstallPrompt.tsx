import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import eecLogo from '@/assets/eec-logo-new.png';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-xl border border-primary/40 bg-[hsl(235,40%,14%)] text-white shadow-[0_0_20px_rgba(85,189,138,0.25)] z-[60] animate-slide-up">
        <div className="flex items-start gap-3">
          <img src={eecLogo} alt="EEC" className="h-10 w-10 mt-0.5 flex-shrink-0 rounded-lg" />
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">Install Elite E-Commerce</h3>
            <ol className="text-sm text-white/70 space-y-1.5 list-decimal list-inside mb-3">
              <li>Tap the <strong className="text-white">Share</strong> button <span className="text-white/90">(☐↑)</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></li>
            </ol>
            <Button
              onClick={handleDismiss}
              size="sm"
              className="w-full"
            >
              Got it
            </Button>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-xl border border-primary/40 bg-[hsl(235,40%,14%)] text-white shadow-[0_0_20px_rgba(85,189,138,0.25)] z-[60] animate-slide-up">
      <div className="flex items-start gap-3">
        <img src={eecLogo} alt="EEC" className="h-10 w-10 mt-0.5 flex-shrink-0 rounded-lg" />
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">Install Elite E-Commerce</h3>
          <p className="text-sm text-white/70 mb-3">
            Get quick access and offline support on your device
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
