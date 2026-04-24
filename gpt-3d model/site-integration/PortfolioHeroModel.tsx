import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type PortfolioHeroModelProps = {
  modelUrl?: string;
  className?: string;
  autoRotate?: boolean;
};

export function PortfolioHeroModel({
  modelUrl = '/portfolio/portfolio-hero-sculpture.glb',
  className,
  autoRotate = true
}: PortfolioHeroModelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(6.2, 3.3, 14.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const target = new THREE.Vector3(0.02, 1.72, 0.12);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.32;
    controls.minDistance = 6.4;
    controls.maxDistance = 12.5;
    controls.minPolarAngle = 48 * Math.PI / 180;
    controls.maxPolarAngle = 75 * Math.PI / 180;
    controls.minAzimuthAngle = -34 * Math.PI / 180;
    controls.maxAzimuthAngle = 34 * Math.PI / 180;

    const ambient = new THREE.HemisphereLight(0xfffbf4, 0xcfc2b4, 1.9);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff1df, 3.8);
    key.position.set(-4.2, 6.2, 4.8);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffd8b8, 0.58);
    fill.position.set(4.2, 2.6, 3.2);
    scene.add(fill);

    let disposed = false;
    let sculpture: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      if (disposed) return;
      sculpture = gltf.scene;
      scene.add(sculpture);
    });

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      const t = performance.now() / 1000;
      const cube = sculpture?.getObjectByName('AI_Data_Glowing_Cube_Core') as THREE.Mesh | undefined;
      const material = cube?.material as THREE.MeshStandardMaterial | undefined;
      if (material) {
        material.emissiveIntensity = 1.45 + Math.sin(t * 1.4) * 0.08;
      }

      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [autoRotate, modelUrl]);

  return <div ref={mountRef} className={className} />;
}
