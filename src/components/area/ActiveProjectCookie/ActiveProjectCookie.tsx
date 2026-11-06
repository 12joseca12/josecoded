"use client";

import { useEffect } from "react";

import { activeProjectCookie, activeProjectCookieMaxAge } from "@/types/area";

export function ActiveProjectCookie({ projectId }: { projectId: string }) {
  useEffect(() => {
    const current = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${activeProjectCookie}=`));
    if (current === `${activeProjectCookie}=${projectId}`) return;
    document.cookie = `${activeProjectCookie}=${projectId}; path=/; max-age=${activeProjectCookieMaxAge}; samesite=lax`;
  }, [projectId]);
  return null;
}
