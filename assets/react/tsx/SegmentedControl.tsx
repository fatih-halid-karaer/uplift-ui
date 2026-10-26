import { useRef, type KeyboardEvent } from 'react';
import { useSlidingIndicator } from './motion';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type SegmentedSize = 'sm' | 'md';

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: SegmentedSize;
  iconOnly?: boolean;
  fullWidthOnPhone?: boolean;
  className?: string;
}

const SIZE: Record<SegmentedSize, { root: string; item: string; icon: string }> = {
  sm: { root: 'h-8 p-0.5', item: 'gap-1.5 px-2.5 text-13', icon: 'text-[0.8rem]' },
  md: { root: 'h-10 p-1', item: 'gap-2 px-3.5 text-sm', icon: 'text-sm' },
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  iconOnly = false,
  fullWidthOnPhone = true,
  className,
}: Readonly<SegmentedControlProps<T>>) {
  const group = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pill = useSlidingIndicator(group, '[aria-checked="true"]', [value, options, size]);
  const enabled = options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0);

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const at = enabled.indexOf(index);
    const last = enabled.length - 1;
    const next = at === last ? 0 : at + 1;
    const prev = at <= 0 ? last : at - 1;
    const step = { ArrowRight: next, ArrowDown: next, ArrowLeft: prev, ArrowUp: prev, Home: 0, End: last }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const target = enabled[step];
    if (target === undefined) return;
    refs.current[target]?.focus();
    onChange(options[target]!.value);
  };

  const focusable = options.some((option) => option.value === value && !option.disabled) ? value : options[enabled[0] ?? 0]?.value;

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={cx(
        'bg-sunken border-line relative isolate inline-flex max-w-full items-stretch rounded-xl border',
        SIZE[size].root,
        fullWidthOnPhone && 'max-sm:flex max-sm:w-full',
        className,
      )}
    >
      <span
        aria-hidden
        style={pill}
        className="bg-panel shadow-card ring-line absolute top-0 left-0 -z-10 rounded-lg ring-1 transition-[transform,width,height,opacity] duration-[420ms] ease-[cubic-bezier(0.34,1.36,0.64,1)] motion-reduce:transition-none"
      />
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            disabled={option.disabled}
            tabIndex={option.value === focusable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
            className={cx(
              'relative flex min-w-0 cursor-pointer items-center justify-center rounded-lg font-medium whitespace-nowrap outline-none select-none',
              'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
              'disabled:cursor-not-allowed disabled:opacity-45',
              SIZE[size].item,
              fullWidthOnPhone && 'max-sm:flex-1',
              active ? 'text-color' : 'text-muted-color enabled:hover:text-color',
            )}
          >
            {option.icon !== undefined && (
              <i className={cx(`icon icon-${option.icon}`, SIZE[size].icon, active && 'text-primary')} aria-hidden />
            )}
            {!iconOnly && <span className="truncate">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
