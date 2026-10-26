import { useEffect, useRef, type ReactNode } from 'react';

import { prefersCalm } from './floating';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type ProgressTone = 'primary' | 'success' | 'warn' | 'danger' | 'info';

const FILL: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
};

const STROKE: Record<ProgressTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
};

const percentOf = (value: number, max: number) => Math.min(100, Math.max(0, (value / (max || 1)) * 100));
const defaultFormat = (percent: number) => `${Math.round(percent)}%`;

interface ProgressBarProps {
  label: string;
  value?: number | null;
  max?: number;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  showValue?: boolean;
  format?: (percent: number) => string;
  className?: string;
}

export function ProgressBar({
  label,
  value,
  max = 100,
  tone = 'primary',
  size = 'md',
  showLabel = false,
  showValue = false,
  format = defaultFormat,
  className,
}: Readonly<ProgressBarProps>) {
  const runner = useRef<HTMLSpanElement>(null);
  const indeterminate = value == null;
  const percent = indeterminate ? 0 : percentOf(value, max);

  useEffect(() => {
    const node = runner.current;
    if (!indeterminate || node === null || prefersCalm() || typeof node.animate !== 'function') return;
    const animation = node.animate([{ transform: 'translateX(-100%)' }, { transform: 'translateX(250%)' }], {
      duration: 1400,
      iterations: Infinity,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
    });
    return () => animation.cancel();
  }, [indeterminate]);

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      {(showLabel || (showValue && !indeterminate)) && (
        <div className="text-13 flex items-center justify-between gap-3">
          {showLabel && <span className="text-color truncate font-medium">{label}</span>}
          {showValue && !indeterminate && <span className="text-muted-color ml-auto tabular-nums">{format(percent)}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-valuenow={indeterminate ? undefined : Math.round(percent)}
        aria-valuetext={indeterminate ? undefined : format(percent)}
        aria-busy={indeterminate || undefined}
        className={cx('bg-sunken relative overflow-hidden rounded-full', size === 'sm' ? 'h-1' : 'h-2')}
      >
        {indeterminate ? (
          <span
            ref={runner}
            className={cx(
              'absolute inset-y-0 left-0 w-2/5 rounded-full',
              FILL[tone],
              'motion-reduce:w-full motion-reduce:animate-pulse motion-reduce:opacity-60',
            )}
          />
        ) : (
          <span
            className={cx('absolute inset-0 rounded-full transition-transform duration-500 ease-[var(--ease-out-quint)]', FILL[tone])}
            style={{ transform: `translateX(${percent - 100}%)` }}
          />
        )}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  label: string;
  value?: number | null;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: ProgressTone;
  showValue?: boolean;
  format?: (percent: number) => string;
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  label,
  value,
  max = 100,
  size = 40,
  thickness = 4,
  tone = 'primary',
  showValue = false,
  format = defaultFormat,
  children,
  className,
}: Readonly<ProgressRingProps>) {
  const indeterminate = value == null;
  const percent = indeterminate ? 0 : percentOf(value, max);
  const radius = (size - thickness) / 2;
  const center = size / 2;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : Math.round(percent)}
      aria-valuetext={indeterminate ? undefined : format(percent)}
      aria-busy={indeterminate || undefined}
      className={cx('relative inline-flex shrink-0 items-center justify-center', STROKE[tone], className)}
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cx('-rotate-90', indeterminate && 'animate-spin [animation-duration:1.1s] motion-reduce:animate-none')}
      >
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-sunken)" strokeWidth={thickness} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={indeterminate ? 72 : 100 - percent}
          className="transition-[stroke-dashoffset] duration-500 ease-[var(--ease-out-quint)]"
        />
      </svg>
      {(children !== undefined || (showValue && !indeterminate)) && (
        <span
          aria-hidden
          className="text-color absolute inset-0 flex items-center justify-center text-[0.6875rem] font-semibold tabular-nums"
        >
          {children ?? format(percent)}
        </span>
      )}
    </div>
  );
}
