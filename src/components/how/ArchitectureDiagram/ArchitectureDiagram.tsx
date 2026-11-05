import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { DiagramLayer } from "@/types/how";

import styles from "./ArchitectureDiagram.module.css";

interface ArchitectureDiagramProps {
  layers: DiagramLayer[];
  label: string;
  caption: string;
  description: string;
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 12h17M14 6l6 6-6 6" />
    </svg>
  );
}

export function ArchitectureDiagram({
  layers,
  label,
  caption,
  description,
}: ArchitectureDiagramProps) {
  return (
    <figure className={styles.figure} aria-label={label}>
      <ol className={styles.flow}>
        {layers.map((layer, index) => (
          <li key={layer.id} className={styles.layer} data-layer={layer.id}>
            <p className={styles.title}>{layer.title}</p>
            <ul className={styles.nodes}>
              {layer.nodes.map((node) => (
                <li key={node.id} className={styles.node} data-node={node.id}>
                  <span className={styles.name}>{node.name}</span>
                  <span className={styles.detail}>{node.detail}</span>
                </li>
              ))}
            </ul>
            {index < layers.length - 1 ? <Arrow /> : null}
          </li>
        ))}
      </ol>
      <VisuallyHidden>{description}</VisuallyHidden>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
