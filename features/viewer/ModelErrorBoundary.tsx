"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches errors from GLBCar (e.g. missing model file) and renders a fallback
 * so the viewer keeps working before the real GLB is added.
 */
export class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
