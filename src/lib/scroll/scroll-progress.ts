"use client";

import { useSyncExternalStore } from "react";

import { scrollProgress } from "./blocks";

type Listener = () => void;

const listeners = new Set<Listener>();
let value = 0;
let frame = 0;

function read(): number {
  return scrollProgress(scrollY, innerHeight, document.documentElement.scrollHeight);
}

function update() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const next = read();
    if (next === value) return;
    value = next;
    listeners.forEach((listener) => {
      listener();
    });
  });
}

function subscribe(listener: Listener): () => void {
  if (listeners.size === 0) {
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    value = read();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    }
  };
}

export function useScrollProgress(): number {
  return useSyncExternalStore(
    subscribe,
    () => value,
    () => 0,
  );
}
