import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface BaseSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  bubble?: 'auto' | 'always' | 'never';
  showLimits?: boolean;
  disabled?: boolean;
  className?: string;
}

interface SingleSliderProps extends BaseSliderProps {
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
}

interface RangeSliderProps extends BaseSliderProps {
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  onCommit?: (value: [number, number]) => void;
}

export type SliderProps = SingleSliderProps | RangeSliderProps;

const isRange = (props: Readonly<SliderProps>): props is Readonly<RangeSliderProps> => typeof props.value !== 'number';
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function Slider(props: Readonly<SliderProps>) {
  const { label, min = 0, max = 100, step = 1, format = String, bubble = 'auto', showLimits = false, disabled = false, className } = props;
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<(HTMLSpanElement | null)[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const range = isRange(props) ? props : null;
  const single = range === null ? (props as SingleSliderProps) : null;
  const values: number[] = range !== null ? [range.value[0], range.value[1]] : [single!.value];
  const decimals = (String(step).split('.')[1] ?? '').length;

  const percent = (value: number) => ((value - min) / (max - min || 1)) * 100;
  const snap = (raw: number) => clamp(Number((Math.round((raw - min) / step) * step + min).toFixed(decimals)), min, max);

  const emit = (index: number, raw: number, commit = false) => {
    let value = snap(raw);
    if (values.length === 2) value = index === 0 ? Math.min(value, values[1]!) : Math.max(value, values[0]!);
    const next = values.map((item, i) => (i === index ? value : item));
    const changed = value !== values[index];
    if (range !== null) {
      const pair: [number, number] = [next[0]!, next[1]!];
      if (changed) range.onChange(pair);
      if (commit) range.onCommit?.(pair);
    } else if (single !== null) {
      if (changed) single.onChange(value);
      if (commit) single.onCommit?.(value);
    }
  };

  const fromPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0) return min;
    return min + ((clientX - box.left) / box.width) * (max - min);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    const raw = fromPointer(event.clientX);
    const low = values[0]!;
    const high = values[1];
    const index = high === undefined ? 0 : Math.abs(raw - low) < Math.abs(raw - high) || (low === high && raw < low) ? 0 : 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setDrag(index);
    emit(index, raw);
    thumbs.current[index]?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  };

  const finish = (event: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    emit(drag, fromPointer(event.clientX), true);
    setDrag(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>, index: number) => {
    const value = values[index]!;
    const big = Math.max(step, Math.round((max - min) / 10 / step) * step);
    const target = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    }[event.key];
    if (target === undefined || disabled) return;
    event.preventDefault();
    emit(index, target, true);
  };

  const fillStart = values.length === 2 ? percent(values[0]!) : 0;
  const fillEnd = percent(values[values.length - 1]!);

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', bubble === 'always' && 'pt-7', disabled && 'opacity-50', className)}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={(event) => {
          if (drag !== null) emit(drag, fromPointer(event.clientX));
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        className={cx('relative h-6 touch-none select-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <div ref={track} className="absolute inset-x-2.25 top-1/2 h-1.5 -translate-y-1/2">
          <span aria-hidden className="bg-sunken absolute inset-0 rounded-full" />
          <span
            aria-hidden
            className={cx('bg-primary absolute inset-y-0 rounded-full', drag === null && 'transition-[left,width] duration-150')}
            style={{ left: `${fillStart}%`, width: `${fillEnd - fillStart}%` }}
          />
          {values.map((value, index) => {
            const range = values.length === 2;
            const active = drag === index;
            return (
              <span
                key={index}
                ref={(node) => {
                  thumbs.current[index] = node;
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={range ? `${label}, ${index === 0 ? 'minimum' : 'maximum'}` : label}
                aria-valuemin={range && index === 1 ? values[0] : min}
                aria-valuemax={range && index === 0 ? values[1] : max}
                aria-valuenow={value}
                aria-valuetext={format(value)}
                aria-orientation="horizontal"
                aria-disabled={disabled || undefined}
                onKeyDown={(event) => onKeyDown(event, index)}
                style={{ left: `${percent(value)}%`, zIndex: active ? 2 : 1 }}
                className={cx(
                  'group/thumb absolute top-1/2 flex size-[1.125rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none',
                  drag === null && 'transition-[left] duration-150',
                )}
              >
                <span
                  className={cx(
                    'bg-panel border-primary block size-full rounded-full border-2 shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-[scale,box-shadow] duration-150',
                    'group-focus-visible/thumb:ring-primary/25 group-focus-visible/thumb:ring-4',
                    active ? 'ring-primary/20 scale-115 ring-4' : 'group-hover/thumb:scale-110',
                  )}
                />
                {bubble !== 'never' && (
                  <span
                    aria-hidden
                    className={cx(
                      'bg-ink-emphasis text-panel pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom rounded-md px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums shadow-card',
                      'transition-[opacity,scale] duration-150 ease-[var(--ease-out-quint)]',
                      bubble === 'always' || active
                        ? 'scale-100 opacity-100'
                        : 'scale-90 opacity-0 group-hover/thumb:scale-100 group-hover/thumb:opacity-100 group-focus-visible/thumb:scale-100 group-focus-visible/thumb:opacity-100',
                    )}
                  >
                    {format(value)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      {showLimits && (
        <div aria-hidden className="text-muted-color flex justify-between px-0.5 text-xs tabular-nums">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      )}
    </div>
  );
}
