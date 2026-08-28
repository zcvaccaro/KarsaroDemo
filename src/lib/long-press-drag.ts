import type { PointerEvent as ReactPointerEvent } from "react";

const LONG_PRESS_MS = 450;
const CANCEL_PX = 12;

export function bindCalendarDragPointer(
  e: ReactPointerEvent,
  startDrag: (e: ReactPointerEvent) => void,
) {
  const target = e.currentTarget as HTMLElement | null;
  if (e.pointerType !== "touch") {
    startDrag(e);
    capturePointer(target, e.pointerId);
    return;
  }

  e.stopPropagation();
  const startX = e.clientX;
  const startY = e.clientY;
  let started = false;

  const timer = window.setTimeout(() => {
    started = true;
    startDrag(e);
    capturePointer(target, e.pointerId);
  }, LONG_PRESS_MS);

  function cleanup() {
    window.clearTimeout(timer);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  }

  function onMove(ev: PointerEvent) {
    if (started) return;
    if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > CANCEL_PX) {
      cleanup();
    }
  }

  function onUp() {
    cleanup();
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function capturePointer(target: HTMLElement | null, pointerId: number) {
  try {
    target?.setPointerCapture?.(pointerId);
  } catch {
    /* Detached node / DevTools touch emulation */
  }
}

export function lockPageScrollForDrag() {
  const html = document.documentElement;
  const body = document.body;
  const prevHtmlOverflow = html.style.overflow;
  const prevBodyOverflow = body.style.overflow;
  const prevHtmlTouch = html.style.touchAction;
  const prevBodyTouch = body.style.touchAction;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  html.style.touchAction = "none";
  body.style.touchAction = "none";

  function preventTouchMove(ev: TouchEvent) {
    ev.preventDefault();
  }
  window.addEventListener("touchmove", preventTouchMove, { passive: false });

  return () => {
    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;
    html.style.touchAction = prevHtmlTouch;
    body.style.touchAction = prevBodyTouch;
    window.removeEventListener("touchmove", preventTouchMove);
  };
}
