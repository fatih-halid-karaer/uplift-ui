import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLeave } from './motion';
export const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');
export function focusQuietly(node) {
  node?.focus({ focusVisible: false });
}
export function initialFocus(root) {
  const preferred = root.querySelector('[data-autofocus]');
  if (preferred !== null) return preferred;
  const candidates = [...root.querySelectorAll(FOCUSABLE)].filter((node) => node.closest('[inert]') === null);
  return candidates.find((node) => !node.matches('[data-infotip], [data-modal-close]')) ?? candidates[0];
}
export function portalTarget(anchor) {
  return anchor?.closest('dialog[open]') ?? document.body;
}
export function useModal(open, onClose, { exitMs = 220, dismissible = true } = {}) {
  const ref = useRef(null);
  const opener = useRef(null);
  const restore = useRef(null);
  const pressedScrim = useRef(false);
  const latest = useRef({ onClose, dismissible });
  const { mounted, leaving } = useLeave(open, exitMs);
  useLayoutEffect(() => {
    latest.current = { onClose, dismissible };
  });
  useLayoutEffect(() => {
    if (!mounted) return;
    const dialog = ref.current;
    if (dialog === null) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    restore.current = null;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    const surface = dialog.querySelector('[data-modal-surface]') ?? dialog;
    focusQuietly(surface);
    const frame = requestAnimationFrame(() => focusQuietly(initialFocus(surface) ?? surface));
    return () => {
      cancelAnimationFrame(frame);
      const inside = restore.current ?? dialog.contains(document.activeElement);
      if (dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      if (inside && opener.current?.isConnected === true) focusQuietly(opener.current);
    };
  }, [mounted]);
  useEffect(() => {
    if (!leaving) return;
    const dialog = ref.current;
    restore.current = dialog !== null && dialog.contains(document.activeElement);
  }, [leaving]);
  const requestClose = () => {
    if (latest.current.dismissible) latest.current.onClose();
  };
  const dialogProps = {
    ref,
    onCancel: (event) => {
      event.preventDefault();
      requestClose();
    },
    onClose: () => {
      if (ref.current !== null && !ref.current.open) latest.current.onClose();
    },
    onPointerDown: (event) => {
      pressedScrim.current = event.target === event.currentTarget;
    },
    onClick: (event) => {
      if (pressedScrim.current && event.target === event.currentTarget) requestClose();
      pressedScrim.current = false;
    },
  };
  return { mounted, leaving, dialogProps, requestClose };
}
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
export function useAnchoredPosition(
  active,
  anchor,
  panel,
  { side = 'bottom', align = 'start', offset = 6, margin = 8, matchWidth = false } = {},
) {
  const [place, setPlace] = useState({ style: { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }, side });
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const box = anchor.current?.getBoundingClientRect();
      const node = panel.current;
      if (box === undefined || node === null) return;
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = window.innerHeight;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const room = {
        top: box.top - offset - margin,
        bottom: viewHeight - box.bottom - offset - margin,
        left: box.left - offset - margin,
        right: viewWidth - box.right - offset - margin,
      };
      const vertical = side === 'top' || side === 'bottom';
      const need = vertical ? height : width;
      const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
      let top;
      let left;
      let maxHeight;
      let origin;
      if (vertical) {
        const shown = Math.min(height, Math.max(96, room[chosen]));
        top = chosen === 'bottom' ? box.bottom + offset : box.top - offset - shown;
        left = align === 'start' ? box.left : align === 'end' ? box.right - width : box.left + box.width / 2 - width / 2;
        left = clamp(left, margin, viewWidth - margin - width);
        top = clamp(top, margin, viewHeight - margin - shown);
        maxHeight = Math.max(96, room[chosen]);
        origin = `${Math.round(clamp(box.left + box.width / 2 - left, 0, width))}px ${chosen === 'bottom' ? '0' : '100%'}`;
      } else {
        left = chosen === 'right' ? box.right + offset : box.left - offset - width;
        top = align === 'start' ? box.top : align === 'end' ? box.bottom - height : box.top + box.height / 2 - height / 2;
        left = clamp(left, margin, viewWidth - margin - width);
        top = clamp(top, margin, viewHeight - margin - height);
        maxHeight = viewHeight - margin * 2;
        origin = `${chosen === 'right' ? '0' : '100%'} ${Math.round(clamp(box.top + box.height / 2 - top, 0, height))}px`;
      }
      const next = {
        position: 'fixed',
        top: Math.round(top),
        left: Math.round(left),
        maxHeight: Math.round(maxHeight),
        minWidth: matchWidth ? Math.round(box.width) : undefined,
        transformOrigin: origin,
      };
      setPlace((current) => {
        const was = current.style;
        const same =
          current.side === chosen &&
          was.visibility === undefined &&
          was.top === next.top &&
          was.left === next.left &&
          was.maxHeight === next.maxHeight &&
          was.minWidth === next.minWidth &&
          was.transformOrigin === next.transformOrigin;
        return same ? current : { style: next, side: chosen };
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    if (panel.current !== null) observer?.observe(panel.current);
    if (anchor.current !== null) observer?.observe(anchor.current);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [active, anchor, panel, side, align, offset, margin, matchWidth]);
  return place;
}
