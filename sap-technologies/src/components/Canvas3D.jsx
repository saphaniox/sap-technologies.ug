/**
 * Canvas3D Component
 * 
 * Advanced 3D scene with interactive geometric shapes and text.
 * 
 * Features:
 * - Floating geometric shapes (spheres, boxes, tori)
 * - Animated 3D text with custom styling
 * - Distortion effects and materials
 * - Orbit controls for user interaction
 * - Environment lighting and stars background
 * - Continuous rotation animations
 * - Color-coded shapes with gradients
 * 
 * Technologies:
 * - React Three Fiber (R3F) for React-based 3D
 * - React Three Drei for helper components
 * - Three.js for 3D graphics engine
 * 
 * @component
 */

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  OrbitControls, 
  Text3D, 
  Center, 
  Environment,
  Sphere,
  Box,
  Torus,
  MeshDistortMaterial,
  Stars
} from "@react-three/drei";
import * as THREE from "three";

// Floating geometric shapes component
function FloatingShapes() {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const shapes = useMemo(() => {
    const positions = [
      [-4, 2, -2],
      [4, -1, -3],
      [-2, -3, 1],
      [3, 3, -1],
      [0, -2, -4],
      [-3, 1, 2]
    ];

    return positions.map((position, index) => ({
      position,
      color: `hsl(${(index * 60) % 360}, 70%, 60%)`,
      type: index % 3
    }));
  }, []);

  return (
    <group ref={groupRef}>
      {shapes.map((shape, index) => (
        <Float
          key={index}
          speed={1 + Math.random() * 2}
          rotationIntensity={0.5 + Math.random() * 0.5}
          floatIntensity={0.5 + Math.random() * 0.5}
          position={shape.position}
        >
          {shape.type === 0 && (
            <Sphere args={[0.5, 32, 32]}>
              <MeshDistortMaterial
                color={shape.color}
                distort={0.3}
                speed={2}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
          )}
          {shape.type === 1 && (
            <Box args={[0.8, 0.8, 0.8]}>
              <meshStandardMaterial
                color={shape.color}
                roughness={0.3}
                metalness={0.7}
              />
            </Box>
          )}
          {shape.type === 2 && (
            <Torus args={[0.6, 0.2, 16, 32]}>
              <meshStandardMaterial
                color={shape.color}
                roughness={0.2}
                metalness={0.9}
              />
            </Torus>
          )}
        </Float>
      ))}
    </group>
  );
}

// Animated background particles
function BackgroundParticles() {
  const pointsRef = useRef();
  const particleCount = 100;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Random positions
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Random colors
      const color = new THREE.Color(`hsl(${Math.random() * 360}, 50%, 70%)`);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
      />
    </points>
  );
}

// 3D Text component
function AnimatedText({ text, position = [0, 0, 0] }) {
  const textRef = useRef();

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      textRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={textRef} position={position}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {text}
          <meshStandardMaterial
            color="#2563eb"
            roughness={0.3}
            metalness={0.8}
          />
        </Text3D>
      </Center>
    </group>
  );
}

// Main 3D Scene component
function Scene3D({ showText = false, text = "SAP Technologies", enableControls = false }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[-10, -10, -10]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />
      
      <Stars
        radius={50}
        depth={50}
        count={200}
        factor={4}
        saturation={0.5}
      />
      
      <BackgroundParticles />
      <FloatingShapes />
      
      {showText && <AnimatedText text={text} />}
      
      <Environment preset="night" />
      
      {enableControls && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.5}
        />
      )}
    </>
  );
}

// 3D Canvas wrapper component
function Canvas3D({ 
  children, 
  className = "", 
  height = "100vh",
  showText = false,
  text = "SAP Technologies",
  enableControls = false,
  alpha = true,
  ...props 
}) {
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha, antialias: true }}
        shadows
        {...props}
      >
        <Scene3D 
          showText={showText} 
          text={text} 
          enableControls={enableControls} 
        />
        {children}
      </Canvas>
    </div>
  );
}

export default Canvas3D;