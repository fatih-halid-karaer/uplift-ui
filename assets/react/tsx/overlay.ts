import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';

import { useLeave } from './motion';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function focusQuietly(node: HTMLElement | null | undefined): void {
  node?.focus({ focusVisible: false } as FocusOptions);
}

export function initialFocus(root: HTMLElement): HTMLElement | undefined {
  const preferred = root.querySelector<HTMLElement>('[data-autofocus]');
  if (preferred !== null) return preferred;
  const candidates = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => node.closest('[inert]') === null);
  return candidates.find((node) => !node.matches('[data-infotip], [data-modal-close]')) ?? candidates[0];
}

export function portalTarget(anchor: Element | null): Element {
  return anchor?.closest('dialog[open]') ?? document.body;
}

interface ModalOptions {
  exitMs?: number;
  dismissible?: boolean;
}

export function useModal(open: boolean, onClose: () => void, { exitMs = 220, dismissible = true }: ModalOptions = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const restore = useRef<boolean | null>(null);
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
    const surface = dialog.querySelector<HTMLElement>('[data-modal-surface]') ?? dialog;
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
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      requestClose();
    },
    onClose: () => {
      if (ref.current !== null && !ref.current.open) latest.current.onClose();
    },
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
      pressedScrim.current = event.target === event.currentTarget;
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (pressedScrim.current && event.target === event.currentTarget) requestClose();
      pressedScrim.current = false;
    },
  };

  return { mounted, leaving, dialogProps, requestClose };
}

interface AnchorOptions {
  side?: Side;
  align?: Align;
  offset?: number;
  margin?: number;
  matchWidth?: boolean;
}

interface Placement {
  style: CSSProperties;
  side: Side;
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(value, high));

export function useAnchoredPosition(
  active: boolean,
  anchor: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
  { side = 'bottom', align = 'start', offset = 6, margin = 8, matchWidth = false }: AnchorOptions = {},
): Placement {
  const [place, setPlace] = useState<Placement>({ style: { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }, side });

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
      const room: Record<Side, number> = {
        top: box.top - offset - margin,
        bottom: viewHeight - box.bottom - offset - margin,
        left: box.left - offset - margin,
        right: viewWidth - box.right - offset - margin,
      };
      const vertical = side === 'top' || side === 'bottom';
      const need = vertical ? height : width;
      const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
      let top: number;
      let left: number;
      let maxHeight: number;
      let origin: string;
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
      const next: CSSProperties = {
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
