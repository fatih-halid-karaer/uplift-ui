import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
export function useMediaQuery(query) {
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
export function readStored(key, parse) {
  if (key === undefined) return undefined;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : parse(raw);
  } catch {
    return undefined;
  }
}
export function writeStored(key, value) {
  if (key === undefined) return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
}
export const parseSize = (min, max) => (raw) => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined;
};
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
}) {
  const [dragging, setDragging] = useState(false);
  const active = useRef(false);
  const last = useRef(size);
  const clamp = (value) => Math.min(max, Math.max(min, Math.round(value)));
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
  const finish = (event) => {
    if (!active.current) return;
    active.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    if (!collapsed) onCommit?.(last.current);
  };
  const handleProps = {
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': 'vertical',
    'aria-label': label,
    'aria-valuemin': onCollapse === undefined ? min : collapsedSize,
    'aria-valuemax': max,
    'aria-valuenow': collapsed ? collapsedSize : size,
    'data-dragging': dragging || undefined,
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      active.current = true;
      last.current = size;
      setDragging(true);
    },
    onPointerMove: (event) => {
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
    onKeyDown: (event) => {
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
