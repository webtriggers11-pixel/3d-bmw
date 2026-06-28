"use client";

import { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Mesh, Material } from "three";
import type { PreviewAnchor } from "@/types";

/**
 * A non-committal "ghost" of the donor's name at the candidate anchor, shown
 * while the donation drawer is open. Uses the SAME position/rotation/scale a
 * committed name would (see NameText / server geometry) so what you preview is
 * what you get. Rendered in an accent colour and pulsed so it reads clearly as a
 * preview rather than a placed name. Pulsing the material opacity is cheap (a
 * uniform update — no troika re-layout per frame).
 */
export function PreviewName({ anchor, name }: { anchor: PreviewAnchor; name: string }) {
  const { coordinates: c, rotation: r, scale } = anchor;
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mat = ref.current?.material as Material | undefined;
    if (mat) {
      mat.transparent = true;
      mat.opacity = 0.45 + 0.35 * Math.sin(clock.elapsedTime * 3);
    }
  });

  return (
    <Text
      ref={ref}
      position={[c.x, c.y, c.z]}
      rotation={[r.x, r.y, r.z]}
      fontSize={0.18 * scale}
      color="#2563eb"
      anchorX="center"
      anchorY="middle"
      maxWidth={1.4}
      outlineWidth={0.006}
      outlineColor="#ffffff"
      fillOpacity={0.95}
    >
      {name || "Your name"}
    </Text>
  );
}
