import { Suspense, useEffect } from "react";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import type { Group, Mesh, MeshStandardMaterial, Texture } from "three";

const HERO_MODEL_PATH = "/portfolio/models/best.glb";

function HeroModel() {
  const { scene } = useGLTF(HERO_MODEL_PATH);
  const { gl } = useThree();

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

    const enhanceTexture = (texture?: Texture | null) => {
      if (!texture) return;

      texture.anisotropy = maxAnisotropy;
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    };

    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const standardMaterial = material as MeshStandardMaterial;
        enhanceTexture(standardMaterial.map);
        enhanceTexture(standardMaterial.normalMap);
        enhanceTexture(standardMaterial.roughnessMap);
        enhanceTexture(standardMaterial.metalnessMap);
        enhanceTexture(standardMaterial.aoMap);
        enhanceTexture(standardMaterial.emissiveMap);

        if (standardMaterial.map) {
          standardMaterial.map.colorSpace = SRGBColorSpace;
        }
      });
    });
  }, [gl, scene]);

  return (
    <primitive object={scene as Group} position={[0, 0.36, 0]} scale={2.7} />
  );
}

useGLTF.preload(HERO_MODEL_PATH);

export default function SculptureScene() {
  return (
    <div className="hero-landing__model-canvas">
      <Canvas
        shadows
        dpr={[2, 4]}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [3.55, 2.05, 6.1], fov: 32, near: 0.1, far: 100 }}
      >
        <ambientLight intensity={0.72} />
        <directionalLight
          position={[-5, 7, 5]}
          intensity={2.35}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[4, 3, 3]} intensity={0.58} color="#ffe4bf" />
        <pointLight position={[0.5, 1.5, 2.4]} intensity={0.36} color="#ffcf92" />

        <Suspense fallback={null}>
          <HeroModel />
          <Environment preset="studio" environmentIntensity={0.72} />
          <ContactShadows
            position={[0, -1.18, 0]}
            opacity={0.34}
            scale={6.5}
            blur={2.4}
            far={3.2}
            color="#7d7164"
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.28}
          minDistance={2.8}
          maxDistance={9.2}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.78}
        />
      </Canvas>
    </div>
  );
}
