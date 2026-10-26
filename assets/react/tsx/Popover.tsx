import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { useLeave } from './motion';
import { FOCUSABLE, focusQuietly, portalTarget, useAnchoredPosition, type Align, type Side } from './overlay';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type DismissReason = 'escape' | 'outside' | 'blur';

const stack: symbol[] = [];

interface FloatingPanelProps {
  open: boolean;
  anchor: RefObject<HTMLElement | null>;
  onDismiss: (reason: DismissReason) => void;
  onOpened?: (panel: HTMLElement) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  side?: Side;
  align?: Align;
  offset?: number;
  matchWidth?: boolean;
  id?: string;
  role?: 'dialog' | 'menu' | 'listbox';
  label?: string;
  className?: string;
  children: ReactNode;
}

export function FloatingPanel({
  open,
  anchor,
  onDismiss,
  onOpened,
  onKeyDown,
  side = 'bottom',
  align = 'start',
  offset = 6,
  matchWidth = false,
  id,
  role,
  label,
  className,
  children,
}: Readonly<FloatingPanelProps>) {
  const panel = useRef<HTMLDivElement>(null);
  const { mounted, leaving } = useLeave(open, 120);
  const place = useAnchoredPosition(mounted, anchor, panel, { side, align, offset, matchWidth });
  const latest = useRef({ onDismiss, onOpened });

  useEffect(() => {
    latest.current = { onDismiss, onOpened };
  });

  useEffect(() => {
    if (!mounted) return;
    const frame = requestAnimationFrame(() => {
      if (panel.current !== null) latest.current.onOpened?.(panel.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const token = Symbol('floating');
    stack.push(token);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || stack[stack.length - 1] !== token) return;
      event.preventDefault();
      event.stopPropagation();
      latest.current.onDismiss('escape');
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.current?.contains(target) || anchor.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-floating]') !== null && stack[stack.length - 1] !== token) return;
      latest.current.onDismiss('outside');
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [open, anchor]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panel}
      id={id}
      role={role}
      aria-label={label}
      tabIndex={-1}
      data-floating
      data-side={place.side}
      style={place.style}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && !event.currentTarget.contains(next) && !anchor.current?.contains(next))
          latest.current.onDismiss('blur');
      }}
      className={cx(
        'border-line bg-panel shadow-float z-50 flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border outline-none',
        'transition-[opacity,scale] starting:scale-95 starting:opacity-0',
        leaving ? 'pointer-events-none scale-[.97] opacity-0 duration-100 ease-in' : 'duration-200 ease-[var(--ease-out-quint)]',
        className,
      )}
    >
      {children}
    </div>,
    portalTarget(anchor.current),
  );
}

export interface PopoverTriggerProps {
  ref: (node: HTMLElement | null) => void;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  'aria-haspopup': 'dialog' | 'menu' | 'listbox';
}

interface PopoverProps {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: Side;
  align?: Align;
  matchWidth?: boolean;
  autoFocus?: boolean;
  className?: string;
  bodyClassName?: string;
}

export function Popover({
  trigger,
  children,
  label,
  open: controlled,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  matchWidth = false,
  autoFocus = true,
  className = 'w-[min(20rem,calc(100vw-1rem))]',
  bodyClassName = 'p-4',
}: Readonly<PopoverProps>) {
  const anchor = useRef<HTMLElement | null>(null);
  const id = useId();
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setInner(next);
    onOpenChange?.(next);
  };
  const close = () => setOpen(false);

  const attach = useCallback((node: HTMLElement | null) => {
    anchor.current = node;
  }, []);

  return (
    <>
      {trigger({
        ref: attach,
        onClick: () => setOpen(!open),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        },
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        'aria-haspopup': 'dialog',
      })}
      <FloatingPanel
        open={open}
        anchor={anchor}
        id={id}
        role="dialog"
        label={label}
        side={side}
        align={align}
        matchWidth={matchWidth}
        className={className}
        onOpened={(panel) => {
          if (autoFocus)
            focusQuietly(panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel);
        }}
        onDismiss={(reason) => {
          setOpen(false);
          if (reason === 'escape') focusQuietly(anchor.current);
        }}
      >
        <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName)}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      </FloatingPanel>
    </>
  );
}
