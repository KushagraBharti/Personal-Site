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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  PCFShadowMap,
  Spherical,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Mesh, MeshStandardMaterial, Texture } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const HERO_MODEL_PATH = "/portfolio/models/3d-model.glb";
const WEBGL_RETRY_DELAY_MS = 1800;
const WEBGL_MAX_RECOVERY_ATTEMPTS = 2;
const HERO_MIN_AZIMUTH_ANGLE = -4.8;
const HERO_MAX_AZIMUTH_ANGLE = -3.24;
const HERO_IDLE_ROTATE_SPEED = 0.2;

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

function BoundedHeroControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const idleDirectionRef = useRef(1);
  const isDraggingRef = useRef(false);
  const azimuthRef = useRef(HERO_MIN_AZIMUTH_ANGLE);
  const { camera } = useThree();
  const offsetRef = useRef(new Vector3());
  const sphericalRef = useRef(new Spherical());

  const normalizeAzimuthToBounds = useCallback((azimuth: number) => {
    let normalizedAzimuth = azimuth;
    const fullTurn = Math.PI * 2;

    while (normalizedAzimuth < HERO_MIN_AZIMUTH_ANGLE) {
      normalizedAzimuth += fullTurn;
    }

    while (normalizedAzimuth > HERO_MAX_AZIMUTH_ANGLE) {
      normalizedAzimuth -= fullTurn;
    }

    return Math.min(
      HERO_MAX_AZIMUTH_ANGLE,
      Math.max(HERO_MIN_AZIMUTH_ANGLE, normalizedAzimuth),
    );
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const offset = offsetRef.current.copy(camera.position).sub(controls.target);
    const spherical = sphericalRef.current.setFromVector3(offset);
    spherical.theta = HERO_MIN_AZIMUTH_ANGLE;
    camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
    azimuthRef.current = HERO_MIN_AZIMUTH_ANGLE;
    idleDirectionRef.current = 1;
    controls.update();
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleDragStart = () => {
      isDraggingRef.current = true;
    };

    const handleDragEnd = () => {
      azimuthRef.current = normalizeAzimuthToBounds(
        controls.getAzimuthalAngle(),
      );
      isDraggingRef.current = false;
    };

    controls.addEventListener("start", handleDragStart);
    controls.addEventListener("end", handleDragEnd);
    return () => {
      controls.removeEventListener("start", handleDragStart);
      controls.removeEventListener("end", handleDragEnd);
    };
  }, [normalizeAzimuthToBounds]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isDraggingRef.current) {
      azimuthRef.current = normalizeAzimuthToBounds(
        controls.getAzimuthalAngle(),
      );
      return;
    }

    let nextAzimuth =
      azimuthRef.current + HERO_IDLE_ROTATE_SPEED * idleDirectionRef.current * delta;

    if (nextAzimuth >= HERO_MAX_AZIMUTH_ANGLE) {
      nextAzimuth = HERO_MAX_AZIMUTH_ANGLE;
      idleDirectionRef.current = -1;
    } else if (nextAzimuth <= HERO_MIN_AZIMUTH_ANGLE) {
      nextAzimuth = HERO_MIN_AZIMUTH_ANGLE;
      idleDirectionRef.current = 1;
    }

    const offset = offsetRef.current.copy(camera.position).sub(controls.target);
    const spherical = sphericalRef.current.setFromVector3(offset);
    spherical.theta = nextAzimuth;
    camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
    azimuthRef.current = nextAzimuth;
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      autoRotate={false}
      minDistance={2.8}
      maxDistance={9.2}
      minAzimuthAngle={HERO_MIN_AZIMUTH_ANGLE}
      maxAzimuthAngle={HERO_MAX_AZIMUTH_ANGLE}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 1.78}
    />
  );
}

export default function SculptureScene({
  onModelReady,
  onSceneUnavailable,
}: {
  onModelReady: () => void;
  onSceneUnavailable: () => void;
}) {
  const [canvasKey, setCanvasKey] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const recoveryAttemptsRef = useRef(0);
  const recoveryTimeoutRef = useRef<number | null>(null);

  const handleModelReady = useCallback(() => {
    recoveryAttemptsRef.current = 0;
    onModelReady();
  }, [onModelReady]);

  const scheduleRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current !== null) return;

    recoveryAttemptsRef.current += 1;
    if (recoveryAttemptsRef.current > WEBGL_MAX_RECOVERY_ATTEMPTS) {
      setIsRecovering(true);
      onSceneUnavailable();
      return;
    }

    setIsRecovering(true);
    recoveryTimeoutRef.current = window.setTimeout(() => {
      recoveryTimeoutRef.current = null;
      setCanvasKey((currentKey) => currentKey + 1);
      setIsRecovering(false);
    }, WEBGL_RETRY_DELAY_MS);
  }, [onSceneUnavailable]);

  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="hero-landing__model-canvas" data-custom-cursor="interactive">
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
              <HeroModel onReady={handleModelReady} />
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

            <BoundedHeroControls />
          </Canvas>
        </SculptureSceneErrorBoundary>
      )}
    </div>
  );
}
