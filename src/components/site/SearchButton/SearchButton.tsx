"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button/Button";
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
    <Button
      variant="quiet"
      size="sm"
      icon={<SearchIcon />}
      iconStart
      collapse
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => {
        openSearch();
      }}
    >
      {labels.label} <kbd className={styles.kbd}>{labels.shortcut}</kbd>
    </Button>
  );
}
