import React, { useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { cn } from '@/lib/utils';
import { iconMap, IconName, lucideFallbacks } from '@/assets/icons';

interface AnimatedIconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  loop?: boolean;
  autoplay?: boolean;
  playOnHover?: boolean;
  className?: string;
  color?: 'primary' | 'white' | 'muted' | 'current';
  onClick?: () => void;
}

const sizeMap = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

const colorMap = {
  primary: 'text-primary',
  white: 'text-white',
  muted: 'text-muted-foreground',
  current: 'text-current',
};

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 'md',
  loop = false,
  autoplay = true,
  playOnHover = false,
  className,
  color = 'primary',
  onClick,
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isHovered, setIsHovered] = useState(false);

  const iconData = iconMap[name];
  const LucideFallback = lucideFallbacks[name];
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const colorClass = colorMap[color];

  // Use Lucide fallback if no Lottie data
  if (!iconData || iconData === null) {
    if (LucideFallback) {
      return (
        <div
          className={cn('inline-flex items-center justify-center', className)}
          style={{ width: pixelSize, height: pixelSize }}
          onClick={onClick}
        >
          <LucideFallback 
            size={pixelSize} 
            className={colorClass}
          />
        </div>
      );
    }
    return null;
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (playOnHover && lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (playOnHover && lottieRef.current) {
      lottieRef.current.stop();
    }
  };

  return (
    <div
      className={cn('inline-flex items-center justify-center', colorClass, className)}
      style={{ width: pixelSize, height: pixelSize }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={iconData}
        loop={playOnHover ? isHovered : loop}
        autoplay={playOnHover ? false : autoplay}
        style={{ width: pixelSize, height: pixelSize }}
      />
    </div>
  );
};

export default AnimatedIcon;
