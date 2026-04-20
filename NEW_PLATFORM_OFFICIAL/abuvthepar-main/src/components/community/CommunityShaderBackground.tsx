import { MeshGradient } from "@paper-design/shaders-react";

export const CommunityShaderBackground = () => (
  <div className="sticky top-0 left-0 w-full h-screen pointer-events-none -mb-[100vh]" style={{ zIndex: 0, opacity: 0.25 }}>
    <MeshGradient
      colors={["#55BD8A", "#e8f5ee", "#3a9d6e", "#ffffff"]}
      speed={0.15}
      style={{ width: "100%", height: "100%" }}
    />
  </div>
);
