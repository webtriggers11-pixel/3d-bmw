"use client";

import { useDonationModal } from "@/store/useDonationModal";

export function AddNameButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const open = useDonationModal((s) => s.open);
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
