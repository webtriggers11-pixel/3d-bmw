"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

/**
 * Loads the car model and normalizes it to a known size/orientation so the
 * anchor positions in lib/anchors.ts line up regardless of the GLB's native
 * scale. The model is scaled so its longest horizontal axis ≈ TARGET_LENGTH,
 * rotated so that long axis runs along Z, centered on X/Z, and sat on the ground.
 *
 * Swap the file by changing MODEL_URL.
 */
const MODEL_URL = "/models/2021_bmw_218i_gran_coupe_1.5.glb";
const TARGET_LENGTH = 4.4;

export function GLBCar() {
  const { scene } = useGLTF(MODEL_URL);

  const { scale, position } = useMemo(() => {
    // Measure, orient long axis along Z, then re-measure.
    const pre = new Box3().setFromObject(scene);
    const preSize = pre.getSize(new Vector3());
    scene.rotation.y = preSize.x > preSize.z ? Math.PI / 2 : 0;
    scene.updateMatrixWorld(true);

    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const longest = Math.max(size.x, size.z) || 1;
    const s = TARGET_LENGTH / longest;

    return {
      scale: s,
      position: [-center.x * s, -box.min.y * s, -center.z * s] as [
        number,
        number,
        number,
      ],
    };
  }, [scene]);

  return <primitive object={scene} scale={scale} position={position} dispose={null} />;
}

useGLTF.preload(MODEL_URL);
