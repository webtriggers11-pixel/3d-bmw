// Shared, client-safe types. Do NOT import the generated Prisma client here —
// these must be usable from client components.

export type NameSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** A donation row as seen in the admin panel (all states, with anchor + payment). */
export interface AdminDonation {
  id: string;
  name: string;
  country: string | null;
  message: string | null;
  amount: number; // paise
  currency: string;
  size: NameSize;
  moderation: ModerationStatus;
  paymentStatus: PaymentStatus;
  anchorKey: string;
  carIndex: number;
  createdAt: string;
}

export interface AdminStats {
  totalRaisedPaise: number;
  paidCount: number;
  contributors: number;
  countries: number;
  byModeration: Record<ModerationStatus, number>;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Placement zone — value tier of a surface on the car. See lib/placement.ts. */
export type Zone = "PREMIUM" | "STANDARD" | "ECONOMY";

/** A candidate anchor for a previewed placement (no reservation). */
export interface PreviewAnchor {
  anchorKey: string;
  label: string;
  coordinates: Vec3;
  rotation: Vec3;
  scale: number;
}

/** Result of GET /api/placement/preview — where a name would land for an amount. */
export interface PreviewPlacement {
  size: NameSize;
  zone: Zone | null;
  zoneLabel: string | null;
  blocked: boolean;
  upgradeHint?: string;
  anchor: PreviewAnchor | null;
}

/** A name placed on a car surface, ready to render. */
export interface PlacedName {
  id: string;
  name: string;
  country: string | null;
  message: string | null;
  size: NameSize;
  anchorKey: string;
  coordinates: Vec3;
  rotation: Vec3;
  scale: number;
  createdAt: string;
}

/** A car plus the names currently on it, shaped for the viewer. */
export interface CarView {
  id: string;
  index: number;
  status: "ACTIVE" | "FULL";
  totalAnchors: number;
  occupied: number;
  names: PlacedName[];
}
