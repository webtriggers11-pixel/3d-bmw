/**
 * Default anchor positions seeded into the DB for each new car. Tuned to the
 * normalized GLB in features/viewer/GLBCar.tsx, which scales the model to
 * length (z) = 4.4, sitting on the ground (y = 0 at the tyres). Measured
 * bounding box of that model: width (x) ≈ 2.03 incl. mirrors → body surface at
 * x ≈ ±0.88, height (y) ≈ 1.38 (roof), half-length (z) = ±2.2 (bumpers).
 *
 * Each name sits flush on a panel: x/z place it on the surface, and `rotation`
 * orients the text plane so its face points outward along the panel's normal
 * (±X for sides, +Y for roof/hood, ±Z for bumpers). Stored in the DB (not
 * hardcoded at render time) so positions can be retuned without a redeploy.
 * Each car supports exactly one name per anchor.
 */
export type AnchorDef = {
  anchorKey: string;
  label: string;
  coordinates: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

export const DEFAULT_ANCHORS: AnchorDef[] = [
  { anchorKey: "hood", label: "Hood", coordinates: { x: 0, y: 0.78, z: 1.4 }, rotation: { x: -1.3, y: 0, z: 0 } },
  { anchorKey: "roof", label: "Roof", coordinates: { x: 0, y: 1.36, z: -0.1 }, rotation: { x: -1.57, y: 0, z: 0 } },
  { anchorKey: "front-door-left", label: "Front Door", coordinates: { x: -0.86, y: 0.68, z: 0.45 }, rotation: { x: 0, y: -1.57, z: 0 } },
  { anchorKey: "rear-door-left", label: "Rear Door", coordinates: { x: -0.86, y: 0.68, z: -0.55 }, rotation: { x: 0, y: -1.57, z: 0 } },
  { anchorKey: "front-fender-right", label: "Front Fender", coordinates: { x: 0.84, y: 0.55, z: 1.25 }, rotation: { x: 0, y: 1.57, z: 0 } },
  { anchorKey: "rear-fender-right", label: "Rear Fender", coordinates: { x: 0.84, y: 0.55, z: -1.25 }, rotation: { x: 0, y: 1.57, z: 0 } },
  { anchorKey: "spoiler", label: "Spoiler", coordinates: { x: 0, y: 0.98, z: -1.95 }, rotation: { x: -0.25, y: 0, z: 0 } },
  { anchorKey: "front-bumper", label: "Bumper", coordinates: { x: 0, y: 0.42, z: 2.05 }, rotation: { x: 0.25, y: 0, z: 0 } },
  { anchorKey: "side-mirror-left", label: "Side Mirror", coordinates: { x: -0.86, y: 0.92, z: 0.85 }, rotation: { x: 0, y: -1.57, z: 0 } },
  { anchorKey: "trunk", label: "Trunk", coordinates: { x: 0, y: 0.92, z: -1.7 }, rotation: { x: -0.8, y: 0, z: 0 } },
  { anchorKey: "roof-edge", label: "Roof Edge", coordinates: { x: 0, y: 1.25, z: -0.85 }, rotation: { x: -1.1, y: 0, z: 0 } },
  { anchorKey: "side-skirt-right", label: "Side Skirt", coordinates: { x: 0.82, y: 0.3, z: 0 }, rotation: { x: 0, y: 1.57, z: 0 } },
];

/**
 * Per-panel render budget (model units), used to size names so they fit their
 * surface like a real car livery — never overflowing onto glass or a neighbour.
 * `width` = how far a name may run along the panel; `maxFont` = its height cap.
 * Big flat surfaces (hood/roof/doors) hold bigger names; thin ones (skirt,
 * mirror) hold small ones. See lib/sizing.ts `fontSizeForName`.
 */
export type PanelBudget = { width: number; maxFont: number };

export const ANCHOR_PANEL: Record<string, PanelBudget> = {
  hood: { width: 1.2, maxFont: 0.22 },
  roof: { width: 1.1, maxFont: 0.22 },
  "front-door-left": { width: 0.95, maxFont: 0.2 },
  "rear-door-left": { width: 0.95, maxFont: 0.2 },
  "front-fender-right": { width: 0.7, maxFont: 0.16 },
  "rear-fender-right": { width: 0.7, maxFont: 0.16 },
  "front-bumper": { width: 0.9, maxFont: 0.15 },
  "side-mirror-left": { width: 0.5, maxFont: 0.12 },
  trunk: { width: 0.95, maxFont: 0.18 },
  spoiler: { width: 0.85, maxFont: 0.15 },
  "roof-edge": { width: 0.85, maxFont: 0.17 },
  "side-skirt-right": { width: 1.0, maxFont: 0.11 },
};

export const DEFAULT_PANEL: PanelBudget = { width: 0.9, maxFont: 0.18 };
