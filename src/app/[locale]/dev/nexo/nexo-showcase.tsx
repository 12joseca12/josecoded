"use client";

import { useState } from "react";

import { Nexo } from "@/components/chat/Nexo/Nexo";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { nexoSizes, type NexoState } from "@/types/nexo";

import styles from "./page.module.css";

interface StateEntry {
  state: NexoState;
  name: string;
  label: string;
}

interface Labels {
  title: string;
  switcher: string;
  preview: string;
  sizes: string;
  gallery: string;
  reducedMotion: string;
}

export function NexoShowcase({ states, labels }: { states: StateEntry[]; labels: Labels }) {
  const [state, setState] = useState<NexoState>("idle");
  const [reduced, setReduced] = useState(false);
  const current = states.find((entry) => entry.state === state) ?? states[0];

  return (
    <div className={styles.page}>
      <Heading level={1} size="h2">
        {labels.title}
      </Heading>

      <section className={styles.section} aria-labelledby="nexo-switcher">
        <Heading level={2} size="h4" id="nexo-switcher">
          {labels.switcher}
        </Heading>
        <div className={styles.switcher}>
          {states.map((entry) => (
            <Button
              key={entry.state}
              size="sm"
              variant={entry.state === state ? "primary" : "light"}
              aria-pressed={entry.state === state}
              data-switch={entry.state}
              onClick={() => {
                setState(entry.state);
              }}
            >
              {entry.name}
            </Button>
          ))}
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={reduced}
            onChange={(event) => {
              setReduced(event.target.checked);
            }}
          />
          <span>{labels.reducedMotion}</span>
        </label>
      </section>

      <section className={styles.section} aria-labelledby="nexo-preview">
        <Heading level={2} size="h4" id="nexo-preview">
          {labels.preview}
        </Heading>
        <div className={styles.stage} data-testid="preview">
          {current ? (
            <Nexo state={current.state} label={current.label} size="xl" reducedMotion={reduced} />
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="nexo-sizes">
        <Heading level={2} size="h4" id="nexo-sizes">
          {labels.sizes}
        </Heading>
        <div className={styles.cells} data-testid="sizes">
          {nexoSizes.map((size) =>
            current ? (
              <div key={size} className={styles.cell}>
                <Nexo
                  state={current.state}
                  label={current.label}
                  size={size}
                  reducedMotion={reduced}
                />
                <span className={styles.caption}>{size}</span>
              </div>
            ) : null,
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="nexo-gallery">
        <Heading level={2} size="h4" id="nexo-gallery">
          {labels.gallery}
        </Heading>
        <ul className={styles.gallery} data-testid="gallery">
          {states.map((entry) => (
            <li key={entry.state} className={styles.cell}>
              <Nexo state={entry.state} label={entry.label} size="md" reducedMotion={reduced} />
              <span className={styles.caption}>{entry.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
