import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  triggerRect?: DOMRect | null;
}

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '✅', '👏', '😂', '🎉', '💯'];

export const ReactionPicker = ({ onSelect, onClose, triggerRect }: ReactionPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const style: React.CSSProperties = triggerRect
    ? {
        position: 'fixed',
        top: triggerRect.top - 48,
        left: triggerRect.right,
        transform: 'translateX(-100%)',
      }
    : {
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 8,
      };

  const picker = (
    <div
      ref={ref}
      className="bg-card border border-border rounded-lg shadow-lg p-2 z-[100]"
      style={style}
    >
      <div className="flex gap-1">
        {COMMON_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-muted rounded-md transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  if (triggerRect) {
    return createPortal(picker, document.body);
  }

  return picker;
};
