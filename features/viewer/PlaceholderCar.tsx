"use client";

/**
 * Stylised placeholder car built from primitives. Renders until a real GLB is
 * dropped into `public/models/car.glb` (see GLBCar). Premium white PBR look.
 */
export function PlaceholderCar() {
  const body = (
    <meshStandardMaterial color="#f5f5f5" metalness={0.6} roughness={0.25} />
  );
  return (
    <group position={[0, 0, 0]}>
      {/* lower body */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.0, 0.6, 4.2]} />
        {body}
      </mesh>
      {/* cabin */}
      <mesh castShadow receiveShadow position={[0, 1.05, -0.1]}>
        <boxGeometry args={[1.7, 0.6, 2.0]} />
        {body}
      </mesh>
      {/* wheels */}
      {(
        [
          [-1.0, 0.25, 1.4],
          [1.0, 0.25, 1.4],
          [-1.0, 0.25, -1.4],
          [1.0, 0.25, -1.4],
        ] as const
      ).map(([x, y, z], i) => (
        <mesh key={i} castShadow position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 24]} />
          <meshStandardMaterial color="#181818" metalness={0.2} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
