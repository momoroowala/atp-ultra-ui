import logoIcon from "@/assets/eec-logo.png";

const AuthHeroSection = () => {
  return (
    <div className="w-full h-64 md:h-full relative overflow-hidden flex items-center justify-center rounded-2xl md:rounded-none"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 50%, #1a1a2e 100%)",
      }}
    >
      {/* Radial green glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(85,189,138,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Orbit rings */}
      <div className="absolute w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full border border-dashed border-white/10" />
      <div className="absolute w-[420px] h-[420px] md:w-[580px] md:h-[580px] rounded-full border border-dashed border-white/5" />

      {/* Logo with glow */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center animate-pulse-slow"
          style={{
            boxShadow: "0 0 40px 8px rgba(85,189,138,0.35), 0 0 80px 20px rgba(85,189,138,0.15)",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <img src={logoIcon} alt="EEC" className="w-14 h-14 md:w-20 md:h-20" />
        </div>
        <p className="text-white/60 text-sm md:text-base font-medium tracking-widest uppercase">
          Elite E-Commerce
        </p>
      </div>

      {/* Floating cards - hidden on small screens */}
      <div
        className="absolute hidden md:flex flex-col gap-2 p-4 rounded-xl"
        style={{
          top: "18%", right: "8%",
          transform: "rotate(6deg)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: "180px",
        }}
      >
        <div className="w-8 h-1 rounded-full bg-[#55BD8A]" />
        <span className="text-white/80 text-xs font-semibold">Your Next Move</span>
        <div className="flex gap-1 mt-1">
          <div className="w-full h-2 rounded-full bg-white/10" />
        </div>
        <div className="w-3/4 h-2 rounded-full bg-[#55BD8A]/30" />
      </div>

      <div
        className="absolute hidden md:flex flex-col gap-2 p-4 rounded-xl"
        style={{
          bottom: "20%", left: "6%",
          transform: "rotate(-4deg)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: "160px",
        }}
      >
        <div className="w-6 h-1 rounded-full bg-[#55BD8A]" />
        <span className="text-white/80 text-xs font-semibold">Module Progress</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-full h-2 rounded-full bg-white/10 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-3/5 bg-[#55BD8A]/60 rounded-full" />
          </div>
          <span className="text-white/50 text-[10px]">60%</span>
        </div>
      </div>

      <div
        className="absolute hidden lg:flex flex-col gap-2 p-4 rounded-xl"
        style={{
          bottom: "12%", right: "12%",
          transform: "rotate(3deg)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: "150px",
        }}
      >
        <div className="w-5 h-1 rounded-full bg-[#55BD8A]" />
        <span className="text-white/80 text-xs font-semibold">Community</span>
        <div className="flex gap-1 mt-1">
          <div className="w-4 h-4 rounded-full bg-[#55BD8A]/30" />
          <div className="w-4 h-4 rounded-full bg-white/10 -ml-1" />
          <div className="w-4 h-4 rounded-full bg-white/10 -ml-1" />
        </div>
      </div>
    </div>
  );
};

export default AuthHeroSection;
