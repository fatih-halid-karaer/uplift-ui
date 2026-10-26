import { useId, type ReactNode } from 'react';

import { useCountUp } from './motion';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type StatTone = 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

const CHIP: Record<StatTone, string> = {
  primary: 'bg-highlight text-primary',
  success: 'bg-success-soft text-success-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
  neutral: 'bg-sunken text-color',
};

const STROKE: Record<StatTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-muted-color',
};

export function sparkPath(points: readonly number[], width = 100, height = 32, pad = 2) {
  if (points.length < 2) return { line: '', area: '' };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((value, i) => [i * step, pad + (1 - (value - min) / range) * (height - pad * 2)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}

interface SparklineProps {
  points: readonly number[];
  tone?: StatTone;
  className?: string;
}

export function Sparkline({ points, tone = 'primary', className }: Readonly<SparklineProps>) {
  const gradient = useId();
  const { line, area } = sparkPath(points);
  if (line === '') return null;

  return (
    <svg aria-hidden viewBox="0 0 100 32" preserveAspectRatio="none" className={cx('h-8 w-full overflow-visible', STROKE[tone], className)}>
      <defs>
        <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill={`url(#${gradient})`}
        className="transition-opacity delay-300 duration-500 motion-reduce:transition-none starting:opacity-0"
      />
      <path
        d={line}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="[stroke-dasharray:1] [stroke-dashoffset:0] transition-[stroke-dashoffset] duration-[900ms] ease-[var(--ease-out-quint)] motion-reduce:transition-none starting:[stroke-dashoffset:1]"
      />
    </svg>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  icon?: string;
  tone?: StatTone;
  format?: (value: number) => string;
  delta?: number;
  deltaFormat?: (delta: number) => string;
  deltaHint?: string;
  goodWhen?: 'up' | 'down';
  spark?: readonly number[];
  sub?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const defaultFormat = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const defaultDelta = (delta: number) => `${Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

export function StatTile({
  label,
  value,
  icon,
  tone = 'primary',
  format = defaultFormat,
  delta,
  deltaFormat = defaultDelta,
  deltaHint,
  goodWhen = 'up',
  spark,
  sub,
  href,
  onClick,
  className,
}: Readonly<StatTileProps>) {
  const counted = useCountUp(Math.round(value * 100)) / 100;
  const interactive = href !== undefined || onClick !== undefined;
  const direction = delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const good = direction === 'flat' ? null : direction === goodWhen;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-color text-[1.625rem] leading-8 font-semibold tracking-tight tabular-nums">
            <span aria-hidden>{format(counted)}</span>
            <span className="sr-only">{format(value)}</span>
          </span>
          <span className="text-muted-color text-13 truncate">{label}</span>
        </div>
        {icon !== undefined && (
          <span aria-hidden className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', CHIP[tone])}>
            <i className={`icon icon-${icon}`} />
          </span>
        )}
      </div>
      {(delta !== undefined || sub !== undefined) && (
        <div className="text-13 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined && (
            <span
              className={cx(
                'inline-flex items-center gap-1 font-medium tabular-nums',
                good === null ? 'text-muted-color' : good ? 'text-success-ink' : 'text-danger-ink',
              )}
            >
              <i
                aria-hidden
                className={cx(
                  'icon text-xs',
                  direction === 'up' ? 'icon-arrow-up-right' : direction === 'down' ? 'icon-arrow-down-right' : 'icon-minus',
                )}
              />
              <span className="sr-only">{direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'}</span>
              {direction !== 'flat' && deltaFormat(delta)}
            </span>
          )}
          {deltaHint !== undefined && <span className="text-muted-color">{deltaHint}</span>}
          {sub !== undefined && <span className="text-muted-color">{sub}</span>}
        </div>
      )}
      {spark !== undefined && spark.length > 1 && (
        <Sparkline points={spark} tone={tone === 'neutral' ? 'primary' : tone} className="mt-1" />
      )}
    </>
  );

  const shell = cx(
    'border-line bg-panel shadow-card flex min-w-0 flex-col gap-3 rounded-xl border p-4 text-left',
    interactive &&
      'cursor-pointer transition-[translate,box-shadow,border-color] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px hover:shadow-float hover:border-field-line motion-reduce:hover:translate-y-0',
    className,
  );

  if (href !== undefined) {
    return (
      <a href={href} onClick={onClick} className={shell}>
        {body}
      </a>
    );
  }
  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} className={cx(shell, 'w-full')}>
        {body}
      </button>
    );
  }
  return <div className={shell}>{body}</div>;
}

interface StatGridProps {
  children: ReactNode;
  label?: string;
  min?: string;
  className?: string;
}

export function StatGrid({ children, label, min = '14rem', className }: Readonly<StatGridProps>) {
  return (
    <section
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}, 100%), 1fr))` }}
      className={cx('grid gap-3', className)}
    >
      {children}
    </section>
  );
}
