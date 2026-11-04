"use client";

import { useEffect } from "react";

import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { isSearchShortcut, openSearch } from "@/lib/search/search-events";
import type { SearchLabels } from "@/types/nav";

import styles from "./SearchButton.module.css";

interface SearchButtonProps {
  labels: SearchLabels;
}

export function SearchButton({ labels }: SearchButtonProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSearchShortcut(event) && openSearch()) event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={labels.label}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => {
        openSearch();
      }}
    >
      <SearchIcon />
      <span className={styles.label} aria-hidden="true">
        {labels.label}
      </span>
      <kbd className={styles.kbd} aria-hidden="true">
        {labels.shortcut}
      </kbd>
    </button>
  );
}
