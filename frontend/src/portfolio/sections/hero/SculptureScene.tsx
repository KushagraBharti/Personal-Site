import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";
import type { Group, Mesh, MeshStandardMaterial, Texture } from "three";

const HERO_MODEL_PATH = "/portfolio/models/best.glb";
const WEBGL_RETRY_DELAY_MS = 1800;

class SculptureSceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function WebGLContextGuard({
  onContextLost,
}: {
  onContextLost: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost, false);
    };
  }, [gl, onContextLost]);

  return null;
}

function HeroModel({ onReady }: { onReady: () => void }) {
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

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
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
    onReady();
  }, [gl, onReady, scene]);

  return (
    <primitive object={scene as Group} position={[0, 0.36, 0]} scale={2.7} />
  );
}

useGLTF.preload(HERO_MODEL_PATH);

export default function SculptureScene({
  onModelReady,
}: {
  onModelReady: () => void;
}) {
  const [canvasKey, setCanvasKey] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const recoveryTimeoutRef = useRef<number | null>(null);

  const scheduleRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current !== null) return;

    setIsRecovering(true);
    recoveryTimeoutRef.current = window.setTimeout(() => {
      recoveryTimeoutRef.current = null;
      setCanvasKey((currentKey) => currentKey + 1);
      setIsRecovering(false);
    }, WEBGL_RETRY_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="hero-landing__model-canvas">
      {isRecovering ? null : (
        <SculptureSceneErrorBoundary
          key={canvasKey}
          onError={scheduleRecovery}
        >
          <Canvas
            fallback={null}
            shadows={{ type: PCFShadowMap }}
            dpr={[1, 1.75]}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "default",
            }}
            camera={{
              position: [3.55, 2.05, 6.1],
              fov: 32,
              near: 0.1,
              far: 100,
            }}
          >
            <WebGLContextGuard onContextLost={scheduleRecovery} />
            <ambientLight intensity={0.72} />
            <directionalLight
              position={[-5, 7, 5]}
              intensity={2.35}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
            />
            <directionalLight
              position={[4, 3, 3]}
              intensity={0.58}
              color="#ffe4bf"
            />
            <pointLight
              position={[0.5, 1.5, 2.4]}
              intensity={0.36}
              color="#ffcf92"
            />

            <Suspense fallback={null}>
              <HeroModel onReady={onModelReady} />
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
        </SculptureSceneErrorBoundary>
      )}
    </div>
  );
}
