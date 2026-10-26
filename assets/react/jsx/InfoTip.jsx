import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const OPEN_DELAY = 120;
const CLOSE_DELAY = 160;
const MARGIN = 8;
const TRIGGER = {
  info: {
    idle: 'text-muted-color hover:bg-sunken hover:text-primary',
    open: 'bg-highlight text-primary',
    chip: 'bg-highlight text-primary',
  },
  accent: { idle: 'text-info hover:bg-info-soft', open: 'bg-info-soft text-info', chip: 'bg-info-soft text-info' },
  warn: { idle: 'text-warn hover:bg-warn-soft', open: 'bg-warn-soft text-warn', chip: 'bg-warn-soft text-warn' },
};
export function InfoTip({
  label,
  title = 'About this page',
  paragraphs,
  warnings = [],
  tone = 'info',
  icon = tone === 'warn' ? 'triangle-alert' : 'info',
  letter,
  size = 'md',
}) {
  const button = useRef(null);
  const panel = useRef(null);
  const timer = useRef(undefined);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [place, setPlace] = useState({ visibility: 'hidden' });
  const look = TRIGGER[tone];
  const later = (next, delay) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  const hide = () => {
    setOpen(false);
    setPinned(false);
  };
  const leave = () => {
    if (!pinned) later(false, CLOSE_DELAY);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === 'Escape') hide();
    };
    const onPointer = (event) => {
      const target = event.target;
      if (!button.current?.contains(target) && !panel.current?.contains(target)) hide();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const anchor = button.current?.getBoundingClientRect();
      const box = panel.current?.getBoundingClientRect();
      if (anchor === undefined || box === undefined) return;
      const below = anchor.bottom + 6;
      const top = below + box.height > innerHeight - MARGIN ? Math.max(MARGIN, anchor.top - 6 - box.height) : below;
      const left = Math.min(Math.max(MARGIN, anchor.left), innerWidth - MARGIN - box.width);
      setPlace({ top, left });
    };
    measure();
    addEventListener('resize', measure);
    addEventListener('scroll', measure, true);
    return () => {
      removeEventListener('resize', measure);
      removeEventListener('scroll', measure, true);
    };
  }, [open]);
  return (
    <>
      <button
        ref={button}
        type="button"
        data-infotip
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => later(true, OPEN_DELAY)}
        onMouseLeave={leave}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) later(true, 0);
        }}
        onBlur={() => {
          setPinned(false);
          later(false, CLOSE_DELAY);
        }}
        onClick={() => {
          setPinned((value) => !value || !open);
          setOpen((value) => !pinned || !value);
        }}
        className={cx(
          'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150',
          size === 'sm' ? 'size-6' : 'size-7',
          open ? look.open : look.idle,
        )}
      >
        {letter !== undefined ? (
          <span
            aria-hidden
            className={cx(
              'flex items-center justify-center rounded-full border-[1.5px] border-current leading-none font-semibold',
              size === 'sm' ? 'size-3.5 text-[0.55rem]' : 'size-4 text-[0.6rem]',
            )}
          >
            {letter}
          </span>
        ) : (
          <i className={`icon icon-${icon} ${size === 'sm' ? 'text-13' : 'text-[0.95rem]'}`} aria-hidden />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panel}
            id={tipId}
            role="tooltip"
            style={place}
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={leave}
            className="border-line bg-panel shadow-float animate-tip-in fixed z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border"
          >
            <div className="border-line-soft bg-subtle flex items-center gap-2 border-b px-4 py-2.5">
              <span className={cx('flex size-6 items-center justify-center rounded-md', look.chip)}>
                {letter !== undefined ? (
                  <span aria-hidden className="text-[0.7rem] leading-none font-semibold">
                    {letter}
                  </span>
                ) : (
                  <i className={`icon icon-${icon} text-xs`} aria-hidden />
                )}
              </span>
              <span className="text-color text-13 font-semibold">{title}</span>
            </div>
            <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto px-4 py-3">
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-muted-color text-13 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {warnings.map((warning) => (
                <p
                  key={warning}
                  className="border-warn-line bg-warn-soft text-warn-ink text-13 flex gap-2 rounded-lg border px-3 py-2 leading-relaxed"
                >
                  <i className="icon icon-triangle-alert text-warn mt-0.5 shrink-0 text-xs" aria-hidden />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
