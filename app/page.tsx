import { SparklesCore } from "@/components/ui/sparkles";
import ModelPreview from "../components/3D";
import { NavBar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="w-full h-screen bg-gray-950">
      <NavBar />
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.9}
          maxSize={1.4}
          speed={0.025}
          particleDensity={90}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <ModelPreview
        minDistance={200}
        maxDistance={1200}
        svgPath="/dmx.svg" // Direct path to SVG file
        // Geometry settings
        bevelEnabled={false}
        depth={15}
        // Material settings for soft metallic look
        useCustomColor={true}
        customColor="#1a1a1a"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.0}
        clearcoat={0.0}
        // Environment
        enableEnvShine={true}
        useEnvironment={true}
        environmentPreset="dawn"
        backgroundColor="transparent"
        // Shine
        useBloom={true}
        bloomIntensity={1}
        // Animation
        autoRotate={true}
        autoRotateSpeed={0.15}
        // Geometry settings
      />
    </div>
  );
}
