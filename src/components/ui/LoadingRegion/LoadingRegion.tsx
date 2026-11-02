import type { ReactNode } from "react";

import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";

export interface LoadingRegionProps {
  loading: boolean;
  label: string;
  fallback: ReactNode;
  children: ReactNode;
}

export function LoadingRegion({ loading, label, fallback, children }: LoadingRegionProps) {
  return (
    <div aria-busy={loading}>
      {loading ? (
        <>
          <span role="status">
            <VisuallyHidden>{label}</VisuallyHidden>
          </span>
          {fallback}
        </>
      ) : (
        children
      )}
    </div>
  );
}
