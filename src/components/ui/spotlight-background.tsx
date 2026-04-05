import React, { useState, useEffect, useRef, useCallback } from "react";

interface SpotlightBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const SpotlightBackground = ({ children, className = "" }: SpotlightBackgroundProps) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(true);
  const idleTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
    setIsIdle(false);
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => setIsIdle(true), 2000);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
    };
  }, [handleMouseMove]);

  return (
    <div className={`relative ${className}`}>
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          opacity: isIdle ? 0.4 : 1,
          background: `radial-gradient(600px at ${mouse.x}px ${mouse.y}px, hsl(var(--primary) / 0.12), transparent 80%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SpotlightBackground;
