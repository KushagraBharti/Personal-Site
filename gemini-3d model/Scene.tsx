import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- Materials ---
const stoneMaterial = new THREE.MeshStandardMaterial({
  color: '#f5f2eb', // Warm ivory/cream
  roughness: 0.8,
  metalness: 0.1,
});

const matteBlackMaterial = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  roughness: 0.9,
  metalness: 0.2,
});

const brushedMetalMaterial = new THREE.MeshStandardMaterial({
  color: '#888888',
  roughness: 0.4,
  metalness: 0.8,
});

// --- Base Structure Components ---
function Pedestal() {
  return (
    <group>
      {/* Bottom large base */}
      <mesh position={[0, -1, 0]} receiveShadow material={stoneMaterial}>
        <cylinderGeometry args={[3, 3, 0.2, 64]} />
      </mesh>
      {/* Mid tier */}
      <mesh position={[0, -0.7, 0]} receiveShadow material={stoneMaterial}>
        <cylinderGeometry args={[2.5, 2.5, 0.3, 64]} />
      </mesh>
      {/* Left pillar */}
      <mesh position={[-1.2, 0.5, 0.5]} receiveShadow castShadow material={stoneMaterial}>
        <cylinderGeometry args={[0.6, 0.6, 2, 32]} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.2, 1, -0.5]} receiveShadow castShadow material={stoneMaterial}>
        <cylinderGeometry args={[0.5, 0.5, 3, 32]} />
      </mesh>
    </group>
  );
}

function Arch() {
  return (
    <mesh position={[0, 1.5, -0.2]} receiveShadow castShadow material={stoneMaterial}>
      <torusGeometry args={[1.2, 0.4, 32, 64]} />
    </mesh>
  );
}

function GlowingCube() {
  const cubeRef = useRef<THREE.Mesh>(null);
  
  // Subtle pulse animation
  useFrame((state) => {
    if (cubeRef.current) {
      const material = cubeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={[0, 1.5, -0.2]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh ref={cubeRef} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial 
            color="#ffeaa7" 
            emissive="#ffb142" 
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </Float>
    </group>
  );
}

function OrbitRings() {
  return (
    <group position={[0, 1.5, -2]}>
      {/* Outer subtle ring */}
      <mesh>
        <ringGeometry args={[4.5, 4.52, 64]} />
        <meshBasicMaterial color="#dcdde1" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner dashed ring placeholder (Three.js LineDashedMaterial requires line geometry, using simple ring for now) */}
      <mesh>
        <ringGeometry args={[3.8, 3.81, 64]} />
        <meshBasicMaterial color="#dcdde1" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// --- Object Placeholders ---
// Replace these meshes with `<primitive object={nodes.YourModel} />` using `useGLTF`
function Laptop() {
  return (
    <group position={[-0.5, 3.5, 0]} rotation={[0.2, 0.4, -0.1]}>
      {/* Base */}
      <mesh castShadow material={matteBlackMaterial}>
        <boxGeometry args={[1.5, 0.05, 1]} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.5, -0.5]} rotation={[1.8, 0, 0]} castShadow material={matteBlackMaterial}>
        <boxGeometry args={[1.5, 1, 0.05]} />
      </mesh>
    </group>
  );
}

function GraduationCap() {
  return (
    <mesh position={[1.2, 2.7, -0.5]} rotation={[0.1, -0.2, 0.1]} castShadow material={matteBlackMaterial}>
      <boxGeometry args={[1.2, 0.1, 1.2]} />
      {/* Tassel placeholder */}
      <mesh position={[0.5, -0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5]} />
        <meshStandardMaterial color="#e17055" /> {/* Muted orange */}
      </mesh>
    </mesh>
  );
}

function Camera() {
  return (
    <mesh position={[-1.2, 1.8, 0.5]} rotation={[0, 0.5, 0]} castShadow material={matteBlackMaterial}>
      <boxGeometry args={[0.8, 0.6, 0.4]} />
      {/* Lens */}
      <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={matteBlackMaterial}>
        <cylinderGeometry args={[0.25, 0.25, 0.4]} />
      </mesh>
    </mesh>
  );
}

function Wrench() {
  return (
    <mesh position={[-0.4, 1.2, 0.8]} rotation={[0, 0, -0.4]} castShadow material={brushedMetalMaterial}>
      <boxGeometry args={[0.2, 1.5, 0.05]} />
    </mesh>
  );
}

function Pen() {
  return (
    <mesh position={[-1, -0.4, 1.2]} rotation={[0, 0, -0.2]} castShadow material={matteBlackMaterial}>
      <cylinderGeometry args={[0.05, 0.05, 0.8]} />
      {/* Gold tip */}
      <mesh position={[0, -0.45, 0]} material={new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8 })}>
        <coneGeometry args={[0.05, 0.2]} />
      </mesh>
    </mesh>
  );
}

function ChefKnife() {
  return (
    <group position={[0, -0.2, 1.5]} rotation={[0.2, 0.5, -0.5]}>
      {/* Handle */}
      <mesh position={[0, 0.4, 0]} castShadow material={matteBlackMaterial}>
        <boxGeometry args={[0.15, 0.6, 0.1]} />
      </mesh>
      {/* Blade */}
      <mesh position={[0, -0.6, 0]} castShadow material={brushedMetalMaterial}>
        <boxGeometry args={[0.2, 1.4, 0.02]} />
      </mesh>
    </group>
  );
}

function Book() {
  return (
    <mesh position={[1, -0.6, 1]} rotation={[0, -0.2, 0]} castShadow material={matteBlackMaterial}>
      <boxGeometry args={[1.2, 0.3, 0.8]} />
      {/* Pages edge */}
      <mesh position={[-0.01, 0, 0.01]} material={stoneMaterial}>
        <boxGeometry args={[1.18, 0.28, 0.78]} />
      </mesh>
    </mesh>
  );
}

function SoccerBall() {
  return (
    <mesh position={[1.5, 0.2, 0.5]} castShadow material={stoneMaterial}>
      {/* Placeholder for Icosahedron / Soccer ball pattern */}
      <sphereGeometry args={[0.4, 32, 32]} />
    </mesh>
  );
}

function RacingHelmet() {
  return (
    <mesh position={[1, 0.3, 1]} rotation={[0, -0.4, 0]} castShadow material={matteBlackMaterial}>
      <sphereGeometry args={[0.6, 32, 32]} />
      {/* Visor */}
      <mesh position={[0, 0.1, 0.4]}>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshStandardMaterial color="#e17055" metalness={0.9} roughness={0.1} /> {/* Muted orange tinted glass */}
      </mesh>
    </mesh>
  );
}

// --- Main Composition ---
export default function SculptureScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f8f6f0' }}>
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        
        {/* Environment & Lighting */}
        <color attach="background" args={['#f8f6f0']} />
        <ambientLight intensity={0.4} color="#ffffff" />
        
        {/* Soft studio light from upper-left */}
        <directionalLight 
          position={[-5, 8, 4]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        
        {/* Gentle fill light from right */}
        <directionalLight position={[4, 2, 2]} intensity={0.3} color="#ffeaa7" />

        {/* Global Environment for metallic reflections */}
        <Environment preset="city" environmentIntensity={0.5} />

        {/* Scene Objects */}
        <group position={[0, -1, 0]}>
          <Pedestal />
          <Arch />
          <GlowingCube />
          <OrbitRings />
          
          <Laptop />
          <GraduationCap />
          <Camera />
          <Wrench />
          <Pen />
          <ChefKnife />
          <Book />
          <SoccerBall />
          <RacingHelmet />
        </group>

        {/* Contact Shadows for realism */}
        <ContactShadows 
          position={[0, -1.9, 0]} 
          opacity={0.6} 
          scale={10} 
          blur={2.5} 
          far={4} 
          color="#8c8273" 
        />

        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2} 
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
