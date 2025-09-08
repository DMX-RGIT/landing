import FadeIn from "@/components/fadeIn";
import ModelPreview from "@/components/3D";
import { NavBar } from "@/components/navbar";
import { Meteors } from "@/components/ui/meteors";
import { SparklesCore } from "@/components/ui/sparkles";

export default function Home() {
  return (
    <div className="w-full h-screen bg-gray-950">
      <FadeIn delay={0.7}>
        <NavBar />
      </FadeIn>
      <div className="w-full relative inset-0 h-screen">
        <Meteors number={20} />
        <FadeIn delay={0}>
          <div className="absolute inset-0 bg-[url('/gol.jpg')] bg-cover bg-center opacity-20"></div>
        </FadeIn>
        <FadeIn>
          <SparklesCore
            id="tsparticlesfullpage"
            background="green"
            minSize={0.9}
            maxSize={1.4}
            speed={0.025}
            particleDensity={90}
            className="absolute inset-0"
            particleColor="#FFFFFF"
          />
        </FadeIn>
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
