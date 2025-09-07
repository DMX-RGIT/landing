import React, { useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture } from "@react-three/drei";
import { SVGModel } from "@/components/svg-model"; // You'll need this component
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

function CustomEnvironment({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);

  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
    }
  }, [texture]);

  return <Environment map={texture} background={false} />;
}

function SimpleEnvironment({
  environmentPreset,
  customHdriUrl,
}: {
  environmentPreset:
    | "apartment"
    | "city"
    | "dawn"
    | "forest"
    | "lobby"
    | "night"
    | "park"
    | "studio"
    | "sunset"
    | "warehouse"
    | "custom";
  customHdriUrl: string | null;
}) {
  return (
    <>
      {environmentPreset === "custom" && customHdriUrl ? (
        <CustomEnvironment imageUrl={customHdriUrl} />
      ) : (
        <Environment
          preset={
            environmentPreset === "custom" ? undefined : environmentPreset
          }
          background={false}
        />
      )}
    </>
  );
}

interface ModelPreviewProps {
  svgData: string;
  depth?: number;
  modelRotationY?: number;
  // Geometry settings
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
  isHollowSvg?: boolean;
  spread?: number;
  // Material settings
  useCustomColor?: boolean;
  customColor?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  transmission?: number;
  envMapIntensity?: number;
  // Environment settings
  backgroundColor?: string;
  useEnvironment?: boolean;
  environmentPreset?: string;
  customHdriUrl?: string | null;
  // Rendering options
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  useBloom?: boolean;
  bloomIntensity?: number;
  bloomMipmapBlur?: boolean;
  isMobile?: boolean;
  className?: string;
}

export const ModelPreview = React.memo<ModelPreviewProps>(
  ({
    svgData,
    depth = 10,
    modelRotationY = 0,
    // Geometry settings
    bevelEnabled = false,
    bevelThickness = 1,
    bevelSize = 0.5,
    bevelSegments = 3,
    isHollowSvg = false,
    spread = 0,
    // Material settings
    useCustomColor = false,
    customColor = "#ffffff",
    roughness = 0.4,
    metalness = 0.6,
    clearcoat = 0,
    transmission = 0,
    envMapIntensity = 1,
    // Environment settings
    backgroundColor = "#000000",
    useEnvironment = true,
    environmentPreset = "dawn",
    customHdriUrl = null,
    // Rendering options
    autoRotate = true,
    autoRotateSpeed = 0.5,
    useBloom = false,
    bloomIntensity = 1,
    bloomMipmapBlur = true,
    isMobile = false,
    className = "",
  }) => {
    const modelRef = useRef<THREE.Group | null>(null);
    const modelGroupRef = useRef<THREE.Group | null>(null);

    const cameraRef = useRef(
      new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        1000
      )
    );

    useEffect(() => {
      const handleResize = () => {
        if (cameraRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const effects = useMemo(() => {
      if (useBloom) {
        return (
          <EffectComposer multisampling={isMobile ? 0 : 4}>
            <Bloom
              intensity={bloomIntensity * 0.7}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.95}
              mipmapBlur={bloomMipmapBlur}
              radius={0.9}
            />
            <BrightnessContrast
              brightness={0.07}
              contrast={0.05}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        );
      } else if (!isMobile) {
        return (
          <EffectComposer multisampling={0}>
            <SMAA preserveEdges />
          </EffectComposer>
        );
      }
      return null;
    }, [useBloom, bloomIntensity, bloomMipmapBlur, isMobile]);

    const environment = useMemo(() => {
      if (!useEnvironment) return null;

      return (
        <SimpleEnvironment
          environmentPreset={
            environmentPreset as
              | "apartment"
              | "city"
              | "dawn"
              | "forest"
              | "lobby"
              | "night"
              | "park"
              | "studio"
              | "sunset"
              | "warehouse"
              | "custom"
          }
          customHdriUrl={customHdriUrl}
        />
      );
    }, [useEnvironment, environmentPreset, customHdriUrl]);

    if (!svgData) return null;

    return (
      <div className={`w-full h-full ${className}`}>
        <Canvas
          shadows
          camera={{ position: [0, 0, 150], fov: 50 }}
          dpr={window?.devicePixelRatio || 1.5}
          frameloop="demand"
          performance={{ min: 0.5 }}
          gl={{
            antialias: true,
            outputColorSpace: "srgb",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            alpha: true,
            logarithmicDepthBuffer: false,
            precision: isMobile ? "mediump" : "highp",
            stencil: false,
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={[backgroundColor]} />

            <ambientLight intensity={0.6 * Math.PI} />

            <directionalLight
              position={[50, 50, 100]}
              intensity={0.8 * Math.PI}
              castShadow={false}
            />

            {environment}

            <group ref={modelGroupRef} rotation={[0, modelRotationY, 0]}>
              <SVGModel
                svgData={svgData}
                depth={depth * 5}
                bevelEnabled={bevelEnabled}
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelSegments={isMobile ? 3 : bevelSegments}
                customColor={useCustomColor ? customColor : undefined}
                roughness={roughness}
                metalness={metalness}
                clearcoat={clearcoat}
                transmission={transmission}
                envMapIntensity={useEnvironment ? envMapIntensity : 0.2}
                receiveShadow={false}
                castShadow={false}
                isHollowSvg={isHollowSvg}
                spread={spread}
                ref={modelRef}
              />
            </group>
          </Suspense>

          {effects}

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            minDistance={50}
            maxDistance={400}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>
    );
  }
);

ModelPreview.displayName = "ModelPreview";

// Hook to load SVG from public directory
export const useSvgLoader = (svgPath: string) => {
  const [svgData, setSvgData] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!svgPath) return;

    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(svgPath);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status}`);
        }

        const svgContent = await response.text();
        setSvgData(svgContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load SVG");
        console.error("Error loading SVG:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [svgPath]);

  return { svgData, loading, error };
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white">Loading SVG...</p>
    </div>
  </div>
);

// Error component
const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center text-red-400">
      <p className="mb-2">Failed to load SVG</p>
      <p className="text-sm opacity-75">{error}</p>
    </div>
  </div>
);

// Usage example with enhanced environmental lighting
export const ExampleUsage: React.FC = () => {
  // Load SVG from public directory
  const { svgData, loading, error } = useSvgLoader("/your-svg-file.svg");

  if (loading) {
    return (
      <div className="w-full h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <ModelPreview
        svgData={svgData}
        // 🔷 BEVEL: NONE
        bevelEnabled={false}
        // ⚫ OVERRIDE SVG COLOR WITH BLACK
        useCustomColor={true}
        customColor="#000000"
        // ✨ METALLIC MATERIAL WITH ENVIRONMENTAL LIGHTING
        metalness={0.9} // High metallic for better env reflections
        roughness={0.1} // Shiny finish reflects environment clearly
        envMapIntensity={2.0} // 🔥 STRONGER environmental lighting influence
        clearcoat={0.3} // Extra shine for env reflections
        // 🌅 DAWN ENVIRONMENT = ENVIRONMENTAL LIGHTING SOURCE
        useEnvironment={true} // 🔥 This enables environmental lighting
        environmentPreset="dawn" // Dawn sky provides lighting + reflections
        backgroundColor="#000000" // Black background (env lighting still works)
        // 🔄 ROTATION
        autoRotate={true}
        autoRotateSpeed={0.3}
        // 📐 GEOMETRY
        depth={15}
      />
    </div>
  );
};

// Alternative: Direct component that loads SVG
interface SVGModelViewerProps extends Omit<ModelPreviewProps, "svgData"> {
  svgPath: string;
}

export const SVGModelViewer: React.FC<SVGModelViewerProps> = ({
  svgPath,
  ...modelProps
}) => {
  const { svgData, loading, error } = useSvgLoader(svgPath);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!svgData) return null;

  return <ModelPreview svgData={svgData} {...modelProps} />;
};

export default ModelPreview;
