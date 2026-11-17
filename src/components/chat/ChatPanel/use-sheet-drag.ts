"use client";

import { type PointerEvent, type RefObject, useCallback, useRef } from "react";

import {
  type DragSample,
  releaseVelocity,
  sheetExitDuration,
  sheetOffset,
  shouldDismissSheet,
} from "@/lib/chat/sheet-drag";

const handleSelector = "[data-sheet-handle], [data-chat-head]";
const controlSelector = "button, a, input, textarea, select, label, [role='switch']";
const draggingMark = "data-dragging";
const exitProperty = "--sheet-exit";
const maxSamples = 24;

export const sheetLayoutQuery = "(min-width: 40rem)";

export const isSheetLayout = (): boolean => !window.matchMedia(sheetLayoutQuery).matches;

interface Drag {
  pointerId: number;
  originY: number;
  start: number;
  offset: number;
  samples: DragSample[];
}

function restingOffset(node: HTMLElement): number {
  const { transform } = getComputedStyle(node);
  return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
}

function place(node: HTMLElement, offset: number): void {
  node.style.transform = `translateY(${offset}px)`;
  node.style.setProperty(
    "--sheet-progress",
    String(Math.min(1, Math.max(0, offset / node.offsetHeight))),
  );
}

function settle(node: HTMLElement): void {
  node.removeAttribute(draggingMark);
  node.style.removeProperty("transform");
  node.style.removeProperty("--sheet-progress");
}

function tokenMs(node: HTMLElement, token: string): number {
  const value = getComputedStyle(node).getPropertyValue(token).trim();
  const amount = Number.parseFloat(value) || 0;
  return value.endsWith("ms") ? amount : amount * 1000;
}

export function clearSheetExit(node: HTMLElement): void {
  node.style.removeProperty(exitProperty);
}

export function useSheetDrag(sheet: RefObject<HTMLDialogElement | null>, dismiss: () => void) {
  const drag = useRef<Drag | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const node = sheet.current;
      const target = event.target;
      if (!node || drag.current || !event.isPrimary || event.button !== 0) return;
      if (!(target instanceof Element) || !target.closest(handleSelector)) return;
      if (target.closest(controlSelector) || !node.matches(":modal") || !isSheetLayout()) return;
      const start = restingOffset(node);
      clearSheetExit(node);
      node.setAttribute(draggingMark, "");
      place(node, start);
      node.setPointerCapture(event.pointerId);
      drag.current = {
        pointerId: event.pointerId,
        originY: event.clientY,
        start,
        offset: start,
        samples: [{ y: event.clientY, t: event.timeStamp }],
      };
    },
    [sheet],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const node = sheet.current;
      const current = drag.current;
      if (!node || current?.pointerId !== event.pointerId) return;
      current.offset = sheetOffset(current.start, current.originY, event.clientY);
      current.samples.push({ y: event.clientY, t: event.timeStamp });
      if (current.samples.length > maxSamples) current.samples.shift();
      place(node, current.offset);
    },
    [sheet],
  );

  const finish = useCallback(
    (event: PointerEvent<HTMLDialogElement>, cancelled: boolean) => {
      const node = sheet.current;
      const current = drag.current;
      if (!node || current?.pointerId !== event.pointerId) return;
      drag.current = null;
      current.samples.push({ y: event.clientY, t: event.timeStamp });
      const velocity = releaseVelocity(current.samples);
      const height = node.offsetHeight;
      const leave =
        !cancelled && shouldDismissSheet(current.offset - current.start, velocity, height);
      if (leave) {
        const duration = sheetExitDuration(height - current.offset, velocity, {
          min: tokenMs(node, "--dur-fast"),
          max: tokenMs(node, "--dur-slow"),
        });
        node.style.setProperty(exitProperty, `${Math.round(duration)}ms`);
      }
      settle(node);
      if (leave) dismiss();
    },
    [sheet, dismiss],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      finish(event, false);
    },
    [finish],
  );
  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      finish(event, true);
    },
    [finish],
  );
  const onLostPointerCapture = onPointerCancel;

  const reset = useCallback(() => {
    drag.current = null;
    if (sheet.current) settle(sheet.current);
  }, [sheet]);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture },
    reset,
  };
}
