"use client";
import React, { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
  // PresentationControls,
} from "@react-three/drei";
import * as THREE from "three";

interface GLBViewerProps {
  modelUrl: string;
  autoRotate?: boolean;
  enableControls?: boolean;
  cameraPosition?: [number, number, number];
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Model component that handles the GLB loading and rendering
const Model: React.FC<{
  url: string;
  autoRotate: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}> = ({ url, autoRotate, onLoad, onError }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Load GLB model
  const { scene, materials } = useGLTF(url, true);

  // Auto-rotation logic
  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1; // Slow rotation
    }
  });

  // Effect to enhance materials and call onLoad
  useEffect(() => {
    if (scene) {
      // Traverse through the scene and enhance materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // Enhance materials for better metallic look
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => enhanceMaterial(mat));
            } else {
              enhanceMaterial(child.material);
            }
          }
        }
      });

      onLoad?.();
    }
  }, [scene, onLoad]);

  // Function to enhance materials
  const enhanceMaterial = (material: THREE.Material) => {
    if (
      material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshPhysicalMaterial
    ) {
      // Enhance metallic properties
      material.metalness = Math.max(material.metalness, 0.8);
      material.roughness = Math.min(material.roughness, 0.3);
      material.envMapIntensity = 1.5;

      // Enable proper rendering
      material.needsUpdate = true;
    }
  };

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
    </group>
  );
};

// Camera setup component
const CameraSetup: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
  }, [camera, position]);

  return null;
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
      <p className="text-white text-lg">Loading 3D Model...</p>
    </div>
  </div>
);

// Error component
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
    <div className="text-center space-y-4 p-6 bg-red-900 bg-opacity-50 rounded-lg">
      <p className="text-white text-lg">Failed to load 3D model</p>
      <p className="text-red-200 text-sm">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

// Main GLB Viewer Component
export const GLBViewer: React.FC<GLBViewerProps> = ({
  modelUrl,
  autoRotate = true,
  enableControls = true,
  cameraPosition = [4, 2, 4],
  className = "",
  onLoad,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleError = (err: Error) => {
    setLoading(false);
    setError(err.message);
    onError?.(err);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  // Performance optimization: frustum culling and pixel ratio
  const [dpr, setDpr] = useState(1);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDpr(Math.min(window.devicePixelRatio, 2));
    }
  }, []);
  const performanceProps = {
    dpr,
    performance: { min: 0.5 }, // Maintain at least 30fps
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        key={retryKey}
        shadows
        camera={{
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 10000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        {...performanceProps}
      >
        {/* Black background */}
        <color attach="background" args={["#000000"]} />

        {/* Camera setup */}
        <CameraSetup position={cameraPosition} />

        {/* Lighting setup */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Dawn environment for realistic metallic reflections */}
        <Environment
          preset="dawn"
          background={false} // Don't override our black background
          environmentIntensity={0.8}
        />

        {/* Model with error boundary */}
        <Suspense fallback={null}>
          <ErrorBoundary onError={handleError}>
            <Model
              url={modelUrl}
              autoRotate={autoRotate}
              onLoad={handleLoad}
              onError={handleError}
            />
          </ErrorBoundary>
        </Suspense>

        {/* Ground shadows */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={4.5}
        />

        {/* Controls */}
        {enableControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={100}
            maxPolarAngle={Math.PI}
            autoRotate={false} // We handle auto-rotate in the Model component
            autoRotateSpeed={0}
          />
        )}

        {/* Alternative: PresentationControls for mobile-optimized interaction */}
        {/* Uncomment this and comment out OrbitControls for better mobile experience */}
        {/*
        <PresentationControls
          enabled={enableControls}
          global={false}
          cursor={true}
          snap={false}
          speed={1}
          zoom={0.8}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          <Model
            url={modelUrl}
            autoRotate={autoRotate}
            onLoad={handleLoad}
            onError={handleError}
          />
        </PresentationControls>
        */}
      </Canvas>

      {/* Loading overlay */}
      {loading && <LoadingSpinner />}

      {/* Error overlay */}
      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
    </div>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("GLB Viewer Error:", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Error will be handled by parent component
    }

    return this.props.children;
  }
}

// Preload function for better performance
export const preloadGLB = (url: string) => {
  useGLTF.preload(url);
};

// Usage example component
export const GLBViewerExample: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <GLBViewer
        modelUrl="/path/to/your/model.glb"
        autoRotate={true}
        enableControls={true}
        cameraPosition={[4, 2, 4]}
        className="rounded-lg"
        onLoad={() => console.log("Model loaded successfully")}
        onError={(error) => console.error("Model loading failed:", error)}
      />
    </div>
  );
};

export default GLBViewer;
