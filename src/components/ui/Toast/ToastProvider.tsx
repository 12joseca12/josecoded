"use client";

import { createContext, type ReactNode, useContext, useState, useSyncExternalStore } from "react";

import { createToastStore, type ToastStore } from "@/lib/toast-store";
import type { ToastInput, ToastItem } from "@/types/ui";

import { Toast } from "./Toast";
import styles from "./Toast.module.css";

const ToastContext = createContext<ToastStore | null>(null);

export function useToast() {
  const store = useContext(ToastContext);
  if (!store) throw new Error("useToast must be used inside ToastProvider");
  return (input: ToastInput) => store.push(input);
}

export interface ToastProviderProps {
  regionLabel: string;
  closeLabel: string;
  children: ReactNode;
}

const getServerSnapshot = (): ToastItem[] => [];

export function ToastProvider({ regionLabel, closeLabel, children }: ToastProviderProps) {
  const [store] = useState(() => createToastStore());
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);

  const render = (list: ToastItem[]) =>
    list.map((item) => (
      <Toast
        key={item.id}
        tone={item.tone}
        title={item.title}
        message={item.message}
        closeLabel={closeLabel}
        onClose={() => {
          store.dismiss(item.id);
        }}
        onPause={() => {
          store.pause(item.id);
        }}
        onResume={() => {
          store.resume(item.id);
        }}
      />
    ));

  return (
    <ToastContext.Provider value={store}>
      {children}
      <section className={styles.region} aria-label={regionLabel}>
        <div className={styles.stack} role="status">
          {render(items.filter((item) => item.tone !== "error"))}
        </div>
        <div className={styles.stack} role="alert">
          {render(items.filter((item) => item.tone === "error"))}
        </div>
      </section>
    </ToastContext.Provider>
  );
}
