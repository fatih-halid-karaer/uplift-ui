import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

const MARGIN = 8;

export type FloatingSide = 'top' | 'bottom';

export interface FloatingOptions {
  gap?: number;
  flipBelow?: number;
  matchWidth?: boolean;
  align?: 'start' | 'end';
}

export const prefersCalm = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useFloating(
  open: boolean,
  anchor: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
  { gap = 6, flipBelow = 220, matchWidth = false, align = 'start' }: FloatingOptions = {},
) {
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', visibility: 'hidden' });
  const [side, setSide] = useState<FloatingSide>('bottom');

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ position: 'fixed', visibility: 'hidden' });
      return;
    }
    const measure = () => {
      const box = anchor.current?.getBoundingClientRect();
      const node = panel.current;
      if (box === undefined || node === null) return;
      const width = matchWidth ? box.width : node.offsetWidth;
      const height = node.scrollHeight;
      const below = innerHeight - box.bottom - gap - MARGIN;
      const above = box.top - gap - MARGIN;
      const up = below < Math.min(height, flipBelow) && above > below;
      const room = Math.max(0, up ? above : below);
      const shown = Math.min(height, room);
      const preferred = align === 'end' ? box.right - width : box.left;
      setSide(up ? 'top' : 'bottom');
      setStyle({
        position: 'fixed',
        top: up ? box.top - gap - shown : box.bottom + gap,
        left: Math.min(Math.max(MARGIN, preferred), Math.max(MARGIN, innerWidth - MARGIN - width)),
        width: matchWidth ? width : undefined,
        maxHeight: room,
      });
    };
    measure();
    addEventListener('resize', measure);
    addEventListener('scroll', measure, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (panel.current !== null) observer?.observe(panel.current);
    return () => {
      removeEventListener('resize', measure);
      removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [open, anchor, panel, gap, flipBelow, matchWidth, align]);

  return { style, side };
}

export type DismissReason = 'escape' | 'outside';

export function useDismiss(
  open: boolean,
  refs: readonly RefObject<HTMLElement | null>[],
  onDismiss: (reason: DismissReason) => void,
  { escape = true }: { escape?: boolean } = {},
) {
  const latest = useRef({ refs, onDismiss });

  useLayoutEffect(() => {
    latest.current = { refs, onDismiss };
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (latest.current.refs.every((ref) => !ref.current?.contains(target))) latest.current.onDismiss('outside');
    };
    const onKey = (event: KeyboardEvent) => {
      if (!escape || event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      latest.current.onDismiss('escape');
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, escape]);
}

export const floatIn = (side: FloatingSide) =>
  `transition-[opacity,translate] duration-150 ease-[var(--ease-out-quint)] starting:opacity-0 ${side === 'top' ? 'starting:translate-y-1' : 'starting:-translate-y-1'}`;
