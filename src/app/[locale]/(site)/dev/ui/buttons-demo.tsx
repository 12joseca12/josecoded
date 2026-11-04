"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { PlayIcon } from "@/components/ui/icons/PlayIcon";
import { type ButtonVariant, buttonVariants } from "@/types/ui";

import styles from "./page.module.css";

export interface ButtonsLabels {
  stateDefault: string;
  withoutIcon: string;
  sizeSmall: string;
  stateDisabled: string;
  stateLoading: string;
  loading: string;
  asLink: string;
  forceHover: string;
  forcePressed: string;
  roles: Record<ButtonVariant, string>;
}

function VariantRow({ variant, labels }: { variant: ButtonVariant; labels: ButtonsLabels }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const icon = variant === "ghost" ? <PlayIcon /> : <ArrowIcon />;
  const forced = {
    "data-hover": hover ? "true" : undefined,
    "data-pressed": pressed ? "true" : undefined,
  };

  return (
    <div className={styles.row}>
      <code className={styles.name}>{variant}</code>
      <p className={styles.note}>{labels.roles[variant]}</p>
      <div className={styles.cells}>
        <Button variant={variant} icon={icon} {...forced}>
          {labels.stateDefault}
        </Button>
        <Button variant={variant} {...forced}>
          {labels.withoutIcon}
        </Button>
        <Button variant={variant} size="sm" icon={icon} {...forced}>
          {labels.sizeSmall}
        </Button>
        <Button variant={variant} icon={icon} disabled {...forced}>
          {labels.stateDisabled}
        </Button>
        <Button variant={variant} icon={icon} loading loadingLabel={labels.loading} {...forced}>
          {labels.stateLoading}
        </Button>
        <Button variant={variant} icon={icon} href="#ui-buttons" {...forced}>
          {labels.asLink}
        </Button>
      </div>
      <div className={styles.cells}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={hover}
            onChange={(event) => {
              setHover(event.target.checked);
            }}
          />
          {labels.forceHover}
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={pressed}
            onChange={(event) => {
              setPressed(event.target.checked);
            }}
          />
          {labels.forcePressed}
        </label>
      </div>
    </div>
  );
}

export function ButtonsDemo({ labels }: { labels: ButtonsLabels }) {
  return (
    <>
      {buttonVariants.map((variant) => (
        <VariantRow key={variant} variant={variant} labels={labels} />
      ))}
    </>
  );
}
