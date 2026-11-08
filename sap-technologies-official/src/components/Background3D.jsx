import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// Simple floating shape for backgrounds
function FloatingShape({ position, shape, color, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const elapsedTime = state.clock.elapsedTime;
      meshRef.current.rotation.x = elapsedTime * speed * 0.5;
      meshRef.current.rotation.y = elapsedTime * speed * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(elapsedTime * speed) * 0.1;
    }
  });

  const ShapeGeometry = {
    sphere: <sphereGeometry args={[0.3, 16, 16]} />,
    box: <boxGeometry args={[0.5, 0.5, 0.5]} />,
    torus: <torusGeometry args={[0.4, 0.1, 8, 16]} />
  };

  return (
    <mesh ref={meshRef} position={position}>
      {ShapeGeometry[shape]}
      <meshStandardMaterial color={color} transparent opacity={0.6} />
    </mesh>
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