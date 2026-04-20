// Notification sound utility using Web Audio API
// Creates a pleasant "pop" sound without needing audio files

let audioContext: AudioContext | null = null;
let audioInitialized = false;

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch (e) {
      console.error('[Sound] Failed to create AudioContext:', e);
      return null;
    }
  }
  return audioContext;
};

// Initialize audio context on first user interaction
export const initializeAudio = (): void => {
  if (audioInitialized) return;
  
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('[Sound] AudioContext resumed');
      audioInitialized = true;
    }).catch(e => {
      console.error('[Sound] Failed to resume AudioContext:', e);
    });
  } else if (ctx) {
    audioInitialized = true;
  }
};

// Set up listeners to initialize audio on user interaction
if (typeof window !== 'undefined') {
  const initOnInteraction = () => {
    initializeAudio();
  };
  
  // Add listeners for common interactions
  window.addEventListener('click', initOnInteraction, { once: true });
  window.addEventListener('keydown', initOnInteraction, { once: true });
  window.addEventListener('touchstart', initOnInteraction, { once: true });
}

export const playNotificationSound = async (): Promise<void> => {
  // Only attempt to play if audio has been initialized by user interaction
  if (!audioInitialized) {
    console.log('[Sound] Skipping notification sound - audio not yet initialized by user interaction');
    return;
  }
  
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }
    
    // Resume context if suspended (required by browsers after user interaction)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Silently fail if we can't resume - user hasn't interacted yet
        return;
      }
    }

    const currentTime = ctx.currentTime;

    // Create oscillator for main tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure sound - pleasant "pop" notification
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, currentTime + 0.1);

    // Volume envelope - quick fade in, gentle fade out
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);

    // Play the sound
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.15);
    
    console.log('[Sound] Notification sound played');
  } catch (error) {
    console.error('[Sound] Failed to play notification sound:', error);
  }
};

// Check if sound notifications are enabled (defaults to true)
export const isSoundEnabled = (): boolean => {
  const stored = localStorage.getItem('community_sound_enabled');
  return stored === null ? true : stored === 'true';
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem('community_sound_enabled', String(enabled));
};
