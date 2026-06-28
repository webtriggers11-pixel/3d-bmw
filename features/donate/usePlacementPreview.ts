"use client";

import { useQuery } from "@tanstack/react-query";
import { useDonationModal } from "@/store/useDonationModal";
import { DEFAULT_MIN_PAISE } from "@/lib/donation-schema";
import { fetchJson } from "@/lib/http";
import type { PreviewPlacement } from "@/types";

async function fetchPreview(amountPaise: number): Promise<PreviewPlacement> {
  return fetchJson<PreviewPlacement>(
    `/api/placement/preview?amountPaise=${amountPaise}`,
  );
}

/**
 * Live placement preview for the current donation draft. Shared by the donation
 * drawer (zone label / upgrade nudge) and the 3D viewer (ghost name). Disabled
 * until the form is open with a valid amount; keeps the previous result while a
 * new amount loads so the preview doesn't flicker.
 */
export function usePlacementPreview() {
  const draft = useDonationModal((s) => s.draft);
  const amountPaise = draft?.amountPaise ?? 0;
  const enabled = !!draft && amountPaise >= DEFAULT_MIN_PAISE;

  return useQuery({
    queryKey: ["placement-preview", amountPaise],
    queryFn: () => fetchPreview(amountPaise),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 5_000,
  });
}
