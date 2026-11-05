"use client";

import { useState } from "react";

export function useMountedOnceOpen(open: boolean): boolean {
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) setMounted(true);
  return mounted || open;
}
