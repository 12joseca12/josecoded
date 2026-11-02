"use client";

import { useEffect } from "react";

import { startBlockScroller } from "./block-scroller";

export function useBlockScroll(): void {
  useEffect(() => startBlockScroller(), []);
}
