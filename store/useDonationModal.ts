import { create } from "zustand";
import type { PreviewAnchor } from "@/types";

/** Live draft the donor is editing, used to preview placement on the car. */
export interface DonationDraft {
  name: string;
  amountPaise: number;
}

interface DonationModalState {
  isOpen: boolean;
  /** Current form draft, or null when the form is closed/empty. */
  draft: DonationDraft | null;
  /** The exact reserved spot during checkout — locks the on-car ghost to it. */
  reserved: PreviewAnchor | null;
  open: () => void;
  close: () => void;
  setDraft: (draft: DonationDraft | null) => void;
  setReserved: (reserved: PreviewAnchor | null) => void;
}

/** Controls the "Add my name" donation drawer + its live placement preview. */
export const useDonationModal = create<DonationModalState>((set) => ({
  isOpen: false,
  draft: null,
  reserved: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, draft: null, reserved: null }),
  setDraft: (draft) => set({ draft }),
  setReserved: (reserved) => set({ reserved }),
}));
