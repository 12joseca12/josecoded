"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import { contentId } from "../SkipLink/SkipLink";

export function RouteFocus() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    document.getElementById(contentId)?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      setAnnouncement(document.title);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <VisuallyHidden>{announcement}</VisuallyHidden>
    </div>
  );
}
