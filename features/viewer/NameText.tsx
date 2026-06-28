"use client";

import { Text } from "@react-three/drei";
import type { PlacedName } from "@/types";

/** Renders a single donor name on the car surface at its anchor. */
export function NameText({ name }: { name: PlacedName }) {
  const { coordinates: c, rotation: r, scale } = name;
  return (
    <Text
      position={[c.x, c.y, c.z]}
      rotation={[r.x, r.y, r.z]}
      fontSize={0.18 * scale}
      color="#111111"
      anchorX="center"
      anchorY="middle"
      maxWidth={1.4}
      outlineWidth={0.004}
      outlineColor="#ffffff"
    >
      {name.name}
    </Text>
  );
}
