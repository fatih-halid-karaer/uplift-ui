const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type BadgeTone = 'primary' | 'neutral' | 'success' | 'warn' | 'danger' | 'info';

const TONE: Record<BadgeTone, string> = {
  primary: 'bg-primary text-primary-contrast',
  neutral: 'bg-sunken text-color',
  success: 'bg-success-soft text-success-ink ring-1 ring-success-line ring-inset',
  warn: 'bg-warn-soft text-warn-ink ring-1 ring-warn-line ring-inset',
  danger: 'bg-danger text-white',
  info: 'bg-info-soft text-info-ink ring-1 ring-info-line ring-inset',
};

interface BadgeProps {
  count: number;
  max?: number;
  tone?: BadgeTone;
  label?: string;
  showZero?: boolean;
  dot?: boolean;
  className?: string;
}

export function Badge({ count, max = 99, tone = 'primary', label, showZero = false, dot = false, className }: Readonly<BadgeProps>) {
  if (count <= 0 && !showZero) return null;
  const text = count > max ? `${max}+` : String(count);

  return (
    <span
      key={dot ? 'dot' : text}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full leading-none font-semibold tabular-nums',
        'transition-[scale,opacity] delay-60 duration-[420ms] ease-[var(--ease-out-quint)] starting:scale-60 starting:opacity-0',
        dot ? 'size-2' : 'h-[1.125rem] min-w-[1.125rem] px-1.5 text-[0.6875rem]',
        TONE[tone],
        className,
      )}
    >
      {label !== undefined ? (
        <>
          {!dot && <span aria-hidden>{text}</span>}
          <span className="sr-only">{label}</span>
        </>
      ) : dot ? null : (
        text
      )}
    </span>
  );
}
