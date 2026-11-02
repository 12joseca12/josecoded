import { MarkerStage } from '@/components/lab/islands/marker-stage';
import { PagingStage } from '@/components/lab/islands/paging-stage';

import type { IslandLabels } from '@/components/lab/islands/types';
import type { LabIsland } from '@/lib/lab/demos';

/**
 * The still of a demo: what the page serves before any interaction and without JavaScript. It is the same
 * markup the island draws (first scene, chosen element), so nothing jumps when the island takes over.
 * Hidden from assistive technology: the text around the frame says what the demo is.
 */
export function DemoPoster({ id, labels }: { id: LabIsland; labels: IslandLabels }) {
  return id === 'paging' ? (
    <PagingStage scenes={labels.paging.scenes} viewport={labels.paging.viewport} />
  ) : (
    <div aria-hidden="true">
      <MarkerStage items={labels.marker.items} label={labels.marker.list} axis="y" active={1} />
    </div>
  );
}
