"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";

const AnnounceContext = createContext<(message: string) => void>(() => undefined);

export function useAnnounce(): (message: string) => void {
  return useContext(AnnounceContext);
}

interface Announcement {
  text: string;
  serial: number;
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState<Announcement>({ text: "", serial: 0 });
  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => ({ text, serial: previous.serial + 1 }));
  }, []);
  const value = useMemo(() => announce, [announce]);
  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <VisuallyHidden>
        <span role="status" key={announcement.serial}>
          {announcement.text}
        </span>
      </VisuallyHidden>
    </AnnounceContext.Provider>
  );
}
