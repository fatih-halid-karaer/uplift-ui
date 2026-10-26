import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { portalTarget, useAnchoredPosition, type Align, type Side } from './overlay';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: Side;
  align?: Align;
  delay?: number;
  disabled?: boolean;
  labelOnly?: boolean;
  className?: string;
}

const WARM_MS = 300;
let warmUntil = 0;

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 450,
  disabled = false,
  labelOnly = false,
  className,
}: Readonly<TooltipProps>) {
  const wrap = useRef<HTMLSpanElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const [open, setOpen] = useState(false);
  const place = useAnchoredPosition(open, anchor, panel, { side, align, offset: 8 });

  useLayoutEffect(() => {
    const first = wrap.current?.firstElementChild;
    anchor.current = first instanceof HTMLElement ? first : null;
  });

  const show = (wait: number) => {
    if (disabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), Date.now() < warmUntil ? 0 : wait);
  };

  const hide = () => {
    clearTimeout(timer.current);
    if (open) warmUntil = Date.now() + WARM_MS;
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const child = children as ReactElement<{ 'aria-describedby'?: string }>;
  const described = child.props['aria-describedby'];
  const trigger = labelOnly
    ? children
    : cloneElement(child, { 'aria-describedby': [described, open ? id : undefined].filter(Boolean).join(' ') || undefined });

  return (
    <>
      <span
        ref={wrap}
        className="contents"
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') show(delay);
        }}
        onPointerLeave={hide}
        onPointerDown={hide}
        onFocus={(event) => {
          if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) show(Math.min(delay, 200));
        }}
        onBlur={hide}
      >
        {trigger}
      </span>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="tooltip"
            data-side={place.side}
            style={place.style}
            className={cx(
              'bg-ink-emphasis text-panel shadow-float pointer-events-none z-[60] max-w-[min(18rem,calc(100vw-1rem))] rounded-md px-2 py-1 text-xs leading-snug font-medium text-pretty',
              'transition-[opacity,scale] duration-150 ease-[var(--ease-out-quint)] starting:scale-90 starting:opacity-0',
              className,
            )}
          >
            {content}
          </div>,
          portalTarget(anchor.current),
        )}
    </>
  );
}
