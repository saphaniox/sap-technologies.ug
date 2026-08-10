import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Box, Torus } from "@react-three/drei";

// Simple floating shape for backgrounds
function FloatingShape({ position, shape, color, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    }
  });

  const ShapeComponent = {
    sphere: () => (
      <Sphere ref={meshRef} args={[0.3, 16, 16]}>
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </Sphere>
    ),
    box: () => (
      <Box ref={meshRef} args={[0.5, 0.5, 0.5]}>
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </Box>
    ),
    torus: () => (
      <Torus ref={meshRef} args={[0.4, 0.1, 8, 16]}>
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </Torus>
    )
  };

  return (
    <Float
      speed={speed}
      rotationIntensity={0.4}
      floatIntensity={0.4}
      position={position}
    >
      {ShapeComponent[shape]()}
    </Float>
  );
}

// Background 3D scene
function Background3DScene() {
  const shapes = [
    { position: [-3, 2, -2], shape: "sphere", color: "#3b82f6", speed: 0.8 },
    { position: [3, -1, -1], shape: "box", color: "#8b5cf6", speed: 1.2 },
    { position: [-1, -2, -3], shape: "torus", color: "#06b6d4", speed: 1.0 },
    { position: [2, 3, -2], shape: "sphere", color: "#10b981", speed: 0.9 },
    { position: [-2, 1, -4], shape: "box", color: "#f59e0b", speed: 1.1 }
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.3} />
      
      {shapes.map((shape, index) => (
        <FloatingShape
          key={index}
          position={shape.position}
          shape={shape.shape}
          color={shape.color}
          speed={shape.speed}
        />
      ))}
    </>
  );
}

// Simple 3D background component
function Background3D({ className = "", height = "100%" }) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Background3DScene />
      </Canvas>
    </div>
  );
}

export default Background3D;