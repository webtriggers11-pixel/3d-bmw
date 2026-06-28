"use client";

import { Text } from "@react-three/drei";
import { fontSizeForName, panelWidthFor } from "@/lib/sizing";
import type { PlacedName } from "@/types";

/** Renders a single donor name on the car surface at its anchor. */
export function NameText({ name }: { name: PlacedName }) {
  const { coordinates: c, rotation: r, scale, anchorKey } = name;
  const fontSize = fontSizeForName(name.name, scale, anchorKey);
  return (
    <Text
      position={[c.x, c.y, c.z]}
      rotation={[r.x, r.y, r.z]}
      fontSize={fontSize}
      color="#111111"
      anchorX="center"
      anchorY="middle"
      maxWidth={panelWidthFor(anchorKey)}
      outlineWidth={fontSize * 0.025}
      outlineColor="#ffffff"
    >
      {name.name}
    </Text>
  );
}
