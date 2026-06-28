"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CarView } from "@/types";
import { PlaceholderCar } from "./PlaceholderCar";
import { GLBCar } from "./GLBCar";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { NameText } from "./NameText";
import { PreviewName } from "./PreviewName";
import { useLiveStream } from "./useLiveStream";
import { useDonationModal } from "@/store/useDonationModal";
import { usePlacementPreview } from "@/features/donate/usePlacementPreview";
import { fetchJson } from "@/lib/http";

async function fetchCars(): Promise<CarView[]> {
  const data = await fetchJson<{ cars: CarView[] }>("/api/cars");
  return data.cars;
}

export function CarViewer() {
  // Live updates via SSE; polling is a fallback safety net.
  useLiveStream();
  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: fetchCars,
    refetchInterval: 30_000,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const car = cars?.[activeIndex];

  // Live placement preview while the donation drawer is open.
  const drawerOpen = useDonationModal((s) => s.isOpen);
  const draftName = useDonationModal((s) => s.draft?.name ?? "");
  const { data: preview } = usePlacementPreview();
  const showPreview = drawerOpen && !!preview && !preview.blocked && !!preview.anchor;

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [4.5, 2.5, 5.5], fov: 42 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={1.2}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-6, 3, -4]} intensity={0.4} />
        <Suspense fallback={null}>
          {/* HDR reflections for PBR paint; falls back to plain lights if offline */}
          <ModelErrorBoundary fallback={null}>
            <Environment preset="city" />
          </ModelErrorBoundary>
          <ModelErrorBoundary fallback={<PlaceholderCar />}>
            <GLBCar />
          </ModelErrorBoundary>
          {car?.names.map((n) => (
            <NameText key={n.id} name={n} />
          ))}
          {showPreview && preview?.anchor && (
            <PreviewName anchor={preview.anchor} name={draftName} />
          )}
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={14} blur={2.4} far={5} />
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Car switcher */}
      {cars && cars.length > 1 && (
        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 p-1 backdrop-blur">
          {cars.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIndex(i)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                i === activeIndex ? "bg-white text-black" : "text-white/80 hover:text-white"
              }`}
            >
              Car {c.index}
            </button>
          ))}
        </div>
      )}

      {/* Occupancy badge */}
      {car && (
        <div className="absolute bottom-4 left-4 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white backdrop-blur">
          {car.occupied}/{car.totalAnchors} spots taken
        </div>
      )}
    </div>
  );
}
