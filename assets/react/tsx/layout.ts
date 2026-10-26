import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}

export function readStored<T>(key: string | undefined, parse: (raw: string) => T | undefined): T | undefined {
  if (key === undefined) return undefined;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : parse(raw);
  } catch {
    return undefined;
  }
}

export function writeStored(key: string | undefined, value: string | null): void {
  if (key === undefined) return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export const parseSize = (min: number, max: number) => (raw: string) => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined;
};

interface ResizeHandleOptions {
  size: number;
  min: number;
  max: number;
  label: string;
  origin: () => number;
  onResize: (size: number) => void;
  onCommit?: (size: number) => void;
  onCollapse?: () => void;
  collapsed?: boolean;
  collapsedSize?: number;
  step?: number;
}

export function useResizeHandle({
  size,
  min,
  max,
  label,
  origin,
  onResize,
  onCommit,
  onCollapse,
  collapsed = false,
  collapsedSize = min,
  step = 16,
}: ResizeHandleOptions) {
  const [dragging, setDragging] = useState(false);
  const active = useRef(false);
  const last = useRef(size);
  const clamp = (value: number) => Math.min(max, Math.max(min, Math.round(value)));

  useEffect(() => {
    if (!dragging) return;
    const body = document.body.style;
    const previous = { cursor: body.cursor, userSelect: body.userSelect };
    body.cursor = 'col-resize';
    body.userSelect = 'none';
    return () => {
      body.cursor = previous.cursor;
      body.userSelect = previous.userSelect;
    };
  }, [dragging]);

  const finish = (event: PointerEvent<HTMLElement>) => {
    if (!active.current) return;
    active.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    if (!collapsed) onCommit?.(last.current);
  };

  const handleProps = {
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': 'vertical' as const,
    'aria-label': label,
    'aria-valuemin': onCollapse === undefined ? min : collapsedSize,
    'aria-valuemax': max,
    'aria-valuenow': collapsed ? collapsedSize : size,
    'data-dragging': dragging || undefined,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      active.current = true;
      last.current = size;
      setDragging(true);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!active.current) return;
      const raw = event.clientX - origin();
      if (onCollapse !== undefined && raw < min - 48) {
        if (!collapsed) onCollapse();
        return;
      }
      last.current = clamp(raw);
      onResize(last.current);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const delta = event.shiftKey ? step * 4 : step;
      const current = collapsed ? collapsedSize : size;
      const target = { ArrowRight: current + delta, ArrowLeft: current - delta, Home: min, End: max }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      if (onCollapse !== undefined && !collapsed && event.key === 'ArrowLeft' && size <= min) {
        onCollapse();
        return;
      }
      const next = clamp(target);
      onResize(next);
      onCommit?.(next);
    },
  };

  return { dragging, handleProps };
}
