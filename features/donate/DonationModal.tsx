"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useDonationModal } from "@/store/useDonationModal";
import { NAME_MAX, MESSAGE_MAX, COUNTRY_MAX } from "@/lib/donation-schema";
import { amountToSize } from "@/lib/sizing";
import { QUICK_AMOUNTS } from "@/lib/format";
import { fetchJson } from "@/lib/http";
import { usePlacementPreview } from "./usePlacementPreview";
import {
  openRazorpayCheckout,
  simulatePayment,
  type CreateOrderResponse,
} from "./checkout";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(NAME_MAX),
  country: z.string().trim().max(COUNTRY_MAX).optional(),
  message: z.string().trim().max(MESSAGE_MAX).optional(),
  amountRupees: z.number().int().min(50, "Minimum ₹50"),
});

type FormValues = z.infer<typeof formSchema>;

export function DonationModal() {
  const { isOpen, close } = useDonationModal();
  const setDraft = useDonationModal((s) => s.setDraft);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { data: preview } = usePlacementPreview();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", country: "", message: "", amountRupees: 100 },
  });

  const amountRupees = watch("amountRupees") || 0;
  const nameValue = watch("name");
  const previewSize = amountToSize(Math.round(amountRupees * 100));

  // Push a debounced draft to the store so the car can live-preview the spot.
  useEffect(() => {
    if (!isOpen || done) return;
    const amountPaise = Math.round((amountRupees || 0) * 100);
    const t = setTimeout(
      () => setDraft({ name: nameValue?.trim() || "", amountPaise }),
      250,
    );
    return () => clearTimeout(t);
  }, [nameValue, amountRupees, isOpen, done, setDraft]);

  if (!isOpen) return null;

  function handleClose() {
    reset();
    setServerError(null);
    setDone(false);
    close();
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
    await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const data = await fetchJson<CreateOrderResponse>(
        "/api/donations/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            country: values.country,
            message: values.message,
            amountPaise: Math.round(values.amountRupees * 100),
          }),
        },
      );

      if (data.simulate) {
        await simulatePayment(data.orderId);
        await refresh();
        setDone(true);
      } else {
        await openRazorpayCheckout(data, {
          donorName: values.name,
          onSuccess: async () => {
            await refresh();
            setDone(true);
          },
          onDismiss: () => setServerError("Payment cancelled."),
        });
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  });

  return (
    <div
      // Light scrim only — the car stays visible behind it so the live preview
      // (highlighted spot + ghost name) reads while the form is open.
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-stretch sm:justify-end"
      onClick={handleClose}
    >
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-6 text-center">
            <div className="text-3xl">🎉</div>
            <h2 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Your name is on the car!
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Rotate the car to find it. Thank you for contributing.
            </p>
            <button
              onClick={handleClose}
              className="mt-5 h-11 w-full rounded-full bg-zinc-900 font-medium text-white dark:bg-white dark:text-black"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Add your name
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <Field label="Name" error={errors.name?.message}>
              <input
                {...register("name")}
                maxLength={NAME_MAX}
                placeholder="Your name"
                className="input"
                autoFocus
              />
            </Field>

            <Field label="Country (optional)" error={errors.country?.message}>
              <input {...register("country")} maxLength={COUNTRY_MAX} placeholder="India" className="input" />
            </Field>

            <Field label="Message (optional)" error={errors.message?.message}>
              <input
                {...register("message")}
                maxLength={MESSAGE_MAX}
                placeholder="Say something"
                className="input"
              />
            </Field>

            <Field label="Contribution" error={errors.amountRupees?.message}>
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setValue("amountRupees", amt, { shouldValidate: true })}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      amountRupees === amt
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">₹</span>
                <input
                  type="number"
                  min={50}
                  {...register("amountRupees", { valueAsNumber: true })}
                  className="input"
                />
                <span className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Size {previewSize}
                </span>
              </div>

              {/* Live placement preview — where this amount lands on the car. */}
              {preview?.blocked ? (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  {preview.upgradeHint ?? "No spot available right now."}
                </p>
              ) : preview?.anchor ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Your name will appear on the{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    {preview.anchor.label.toLowerCase()}
                  </span>{" "}
                  · {preview.zoneLabel} · look at the car to see it.
                </p>
              ) : null}
            </Field>

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-zinc-900 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Processing…" : `Contribute ₹${amountRupees || 0}`}
            </button>
            <p className="text-center text-xs text-zinc-400">
              Funds support this project directly · not a registered charity
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
