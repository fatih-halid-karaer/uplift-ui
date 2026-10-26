import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { portalTarget, useAnchoredPosition } from './overlay';
const cx = (...parts) => parts.filter(Boolean).join(' ');
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
}) {
  const wrap = useRef(null);
  const anchor = useRef(null);
  const panel = useRef(null);
  const timer = useRef(undefined);
  const id = useId();
  const [open, setOpen] = useState(false);
  const place = useAnchoredPosition(open, anchor, panel, { side, align, offset: 8 });
  useLayoutEffect(() => {
    const first = wrap.current?.firstElementChild;
    anchor.current = first instanceof HTMLElement ? first : null;
  });
  const show = (wait) => {
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
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);
  const child = children;
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
