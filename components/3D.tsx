"use client";
import React, { useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture } from "@react-three/drei";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
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

// SVG Model component using Three.js SVGLoader
const SVGModel: React.FC<{
  svgPath: string;
  depth: number;
  useCustomColor: boolean;
  customColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  transmission: number;
  envMapIntensity: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  enableEnvShine?: boolean;
}> = ({
  svgPath,
  depth,
  useCustomColor,
  customColor,
  metalness,
  roughness,
  clearcoat,
  transmission,
  envMapIntensity,
  bevelEnabled,
  bevelThickness,
  bevelSize,
  bevelSegments,
  enableEnvShine = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const loader = new SVGLoader();

    loader.load(
      svgPath,
      (data) => {
        const paths = data.paths;
        const group = groupRef.current;

        if (!group) return;

        // Clear previous geometry
        while (group.children.length) {
          const child = group.children[0];
          group.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        }

        // Calculate overall bounding box for centering the entire SVG
        let globalBoundingBox = new THREE.Box3();
        let tempGeometries: THREE.ExtrudeGeometry[] = [];

        // First pass: create all geometries and calculate global bounds
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          const shapes = SVGLoader.createShapes(path);

          for (let j = 0; j < shapes.length; j++) {
            const shape = shapes[j];

            const extrudeSettings = {
              depth: depth,
              bevelEnabled: bevelEnabled,
              bevelThickness: bevelThickness,
              bevelSize: bevelSize,
              bevelSegments: bevelSegments,
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.computeBoundingBox();

            if (geometry.boundingBox) {
              globalBoundingBox.union(geometry.boundingBox);
            }

            tempGeometries.push(geometry);
          }
        }

        // Calculate global center
        const globalCenter = new THREE.Vector3();
        globalBoundingBox.getCenter(globalCenter);

        // Second pass: create meshes with proper positioning
        let geometryIndex = 0;
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          const shapes = SVGLoader.createShapes(path);

          for (let j = 0; j < shapes.length; j++) {
            const geometry = tempGeometries[geometryIndex];

            // Only translate by global center to keep letters in their relative positions
            geometry.translate(
              -globalCenter.x,
              -globalCenter.y,
              -globalCenter.z
            );

            // Create material
            const material = new THREE.MeshPhysicalMaterial({
              color: useCustomColor ? customColor : path.color || "#ffffff",
              metalness: metalness,
              roughness: roughness,
              clearcoat: clearcoat,
              transmission: transmission,
              envMapIntensity: enableEnvShine
                ? Math.max(envMapIntensity, 2)
                : envMapIntensity,
              reflectivity: enableEnvShine ? 1 : 0.5,
              side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Fix vertical flip
            mesh.scale.y = -1;

            group.add(mesh);
            geometryIndex++;
          }
        }
      },
      (progress) => {
        console.log("SVG loading progress:", progress);
      },
      (error) => {
        console.error("SVG loading error:", error);
      }
    );

    return () => {
      // Cleanup on unmount
      if (groupRef.current) {
        groupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [
    svgPath,
    depth,
    useCustomColor,
    customColor,
    metalness,
    roughness,
    clearcoat,
    transmission,
    envMapIntensity,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelSegments,
  ]);

  return <group ref={groupRef} />;
};

interface ModelPreviewProps {
  svgPath: string;
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
  enableEnvShine?: boolean;
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
  // Camera distance controls
  cameraDistance?: number;
  minDistance?: number;
  maxDistance?: number;
}

export const ModelPreview = React.memo<ModelPreviewProps>(
  ({
    svgPath,
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
    enableEnvShine = false,
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
    // Camera distance controls - UPDATED FOR FARTHER VIEW
    cameraDistance = 300, // Increased from 150
    minDistance = 100, // Increased from 50
    maxDistance = 800, // Increased from 400
  }) => {
    const modelGroupRef = useRef<THREE.Group | null>(null);

    // Use default aspect ratio for SSR, update on client
    const cameraRef = useRef(
      new THREE.PerspectiveCamera(
        50,
        1.5, // Default aspect ratio for SSR
        1,
        2000 // Increased far plane to accommodate farther distances
      )
    );

    useEffect(() => {
      const handleResize = () => {
        if (cameraRef.current && typeof window !== "undefined") {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
        }
      };
      if (typeof window !== "undefined") {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
        };
      }
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

    if (!svgPath) return null;

    return (
      <div className={`w-full h-full ${className}`}>
        <Canvas
          shadows
          camera={{
            position: [0, 0, cameraDistance], // Use configurable distance
            fov: 50,
            near: 1,
            far: 2000, // Increased far plane
          }}
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

            <ambientLight intensity={0.7 * Math.PI} />

            <directionalLight
              position={[50, 50, 100]}
              intensity={0.9 * Math.PI}
              castShadow={false}
            />

            {environment}

            <group ref={modelGroupRef} rotation={[0, modelRotationY, 0]}>
              <SVGModel
                svgPath={svgPath}
                depth={depth}
                useCustomColor={useCustomColor}
                customColor={customColor}
                metalness={metalness}
                roughness={roughness}
                clearcoat={clearcoat}
                transmission={transmission}
                envMapIntensity={envMapIntensity}
                bevelEnabled={bevelEnabled}
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelSegments={bevelSegments}
                enableEnvShine={enableEnvShine}
              />
            </group>
          </Suspense>

          {effects}

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            minDistance={minDistance} // Use configurable min distance
            maxDistance={maxDistance} // Use configurable max distance
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

// Updated usage example with farther camera
export const ExampleUsage: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <ModelPreview
        svgPath="/your-svg-file.svg"
        // 📷 CAMERA DISTANCE - Much farther back
        cameraDistance={400} // Default was 150, now 400
        minDistance={150} // Default was 50, now 150
        maxDistance={1000} // Default was 400, now 1000
        // Geometry settings
        bevelEnabled={false}
        depth={15}
        // Material settings for soft metallic look
        useCustomColor={true}
        customColor="#1a1a1a"
        metalness={0.7}
        roughness={0.4}
        envMapIntensity={1.0}
        clearcoat={0.0}
        // Environment
        useEnvironment={true}
        environmentPreset="dawn"
        backgroundColor="#000000"
        // Animation
        autoRotate={true}
        autoRotateSpeed={0.3}
      />
    </div>
  );
};

export default ModelPreview;
