"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "noc_consent_v1";

/**
 * One-time consent/disclaimer gate shown before the user interacts. Frames the
 * project as for-fun + contribution, and makes the no-affiliation + not-a-charity
 * disclaimers explicit. Choice is remembered in localStorage.
 */
export function ConsentModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(CONSENT_KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="text-3xl">🎉</div>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Just for fun
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          This is a playful community project. Add your name to a 3D car for fun —
          and your contribution helps keep it running. Before you jump in, the
          fine print:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Contributions support this project directly. It is{" "}
              <strong>not a registered charity</strong> and payments are not
              tax-deductible.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>Names and messages are public and visible to everyone — keep it kind.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              This site is <strong>not affiliated with, endorsed by, or sponsored
              by BMW</strong> or any car manufacturer. The model is shown purely
              for fun.
            </span>
          </li>
        </ul>
        <button
          onClick={accept}
          className="mt-6 h-12 w-full rounded-full bg-zinc-900 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          I&apos;m in — let&apos;s go
        </button>
      </div>
    </div>
  );
}
