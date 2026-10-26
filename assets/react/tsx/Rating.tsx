import { useId, useState } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

const STAR = 'M12 2.6l2.9 5.88 6.5.95-4.7 4.58 1.1 6.47L12 17.43l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z';

function Star({ fill, size }: Readonly<{ fill: number; size: string }>) {
  const clip = `inset(0 ${100 - fill * 100}% 0 0)`;
  return (
    <span aria-hidden className={cx('relative inline-flex shrink-0', size)}>
      <svg viewBox="0 0 24 24" className="text-field-line absolute inset-0 size-full">
        <path d={STAR} fill="currentColor" fillOpacity={0.35} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 24 24" className="text-warn absolute inset-0 size-full" style={{ clipPath: clip }}>
        <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
    </span>
  );
}

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
  className?: string;
}

const SIZE = { sm: 'size-4', md: 'size-5', lg: 'size-7' } as const;

export function Rating({
  value,
  onChange,
  label,
  max = 5,
  size = 'md',
  readOnly = onChange === undefined,
  showValue = false,
  className,
}: Readonly<RatingProps>) {
  const name = useId();
  const [hover, setHover] = useState<number | null>(null);
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (readOnly) {
    return (
      <span role="img" aria-label={`${label}: ${value} out of ${max}`} className={cx('inline-flex items-center gap-0.5', className)}>
        {stars.map((n) => (
          <Star key={n} size={SIZE[size]} fill={Math.min(1, Math.max(0, value - n + 1))} />
        ))}
        {showValue && <span className="text-muted-color text-13 ml-1.5 tabular-nums">{value.toFixed(1)}</span>}
      </span>
    );
  }

  const shown = hover ?? value;

  return (
    <div role="radiogroup" aria-label={label} onMouseLeave={() => setHover(null)} className={cx('inline-flex items-center', className)}>
      {stars.map((n) => (
        <label
          key={n}
          onMouseEnter={() => setHover(n)}
          className="has-focus-visible:outline-primary flex cursor-pointer items-center justify-center rounded-md p-0.5 transition-transform duration-150 ease-[var(--ease-out-quint)] hover:scale-115 has-focus-visible:outline-2"
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange?.(n)}
            onClick={() => {
              if (value === n) onChange?.(0);
            }}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            className="sr-only"
          />
          <Star size={SIZE[size]} fill={n <= shown ? 1 : 0} />
        </label>
      ))}
      {showValue && (
        <span className="text-muted-color text-13 ml-1.5 tabular-nums" aria-hidden>
          {shown}/{max}
        </span>
      )}
    </div>
  );
}
