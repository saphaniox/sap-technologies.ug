import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text3D, Center, Environment, MeshDistortMaterial, Sphere } from "@react-three/drei";

// Animated central sphere
function HeroSphere() {
  const sphereRef = useRef();

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.3}>
      <Sphere ref={sphereRef} args={[1.2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#3b82f6"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.8}
        />
      </Sphere>
    </Float>
  );
}

// Orbiting elements
function OrbitingElements() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const elements = [
    { angle: 0, distance: 3, color: "#8b5cf6", size: 0.3 },
    { angle: Math.PI / 2, distance: 3.5, color: "#06b6d4", size: 0.25 },
    { angle: Math.PI, distance: 3.2, color: "#10b981", size: 0.35 },
    { angle: (3 * Math.PI) / 2, distance: 3.8, color: "#f59e0b", size: 0.28 }
  ];

  return (
    <group ref={groupRef}>
      {elements.map((element, index) => (
        <Float
          key={index}
          speed={1 + index * 0.2}
          rotationIntensity={0.3}
          floatIntensity={0.2}
        >
          <Sphere
            args={[element.size, 16, 16]}
            position={[
              Math.cos(element.angle) * element.distance,
              Math.sin(element.angle * 0.5) * 0.5,
              Math.sin(element.angle) * element.distance
            ]}
          >
            <meshStandardMaterial
              color={element.color}
              roughness={0.2}
              metalness={0.7}
              transparent
              opacity={0.7}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

// Hero 3D scene
function Hero3DScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      <HeroSphere />
      <OrbitingElements />
      
      <Environment preset="night" />
    </>
  );
}

// Hero 3D component
function Hero3D({ className = "", height = "600px" }) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Hero3DScene />
      </Canvas>
    </div>
  );
}

export default Hero3D;