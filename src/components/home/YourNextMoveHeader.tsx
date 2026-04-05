import targetIcon from '@/assets/target-icon.png';

export const YourNextMoveHeader = () => {
  return (
    <div className="flex items-center gap-4 py-2">
      <img 
        src={targetIcon} 
        alt="Target" 
        className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0" 
      />
      <div>
        <h2 className="text-xl font-bold text-foreground">Your Next Move</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Keep going — you're building momentum!
        </p>
      </div>
    </div>
  );
};
