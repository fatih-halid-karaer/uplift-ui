import { useId, type ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface RadioOption<V extends string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  icon?: string;
  disabled?: boolean;
}

interface RadioGroupProps<V extends string> {
  label: ReactNode;
  options: readonly RadioOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'plain' | 'cards';
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
}

export function RadioGroup<V extends string>({
  label,
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
  variant = 'plain',
  hint,
  error,
  required = false,
  disabled = false,
  hideLabel = false,
  className,
}: Readonly<RadioGroupProps<V>>) {
  const auto = useId();
  const groupName = name ?? auto;
  const errorId = `${auto}-error`;
  const invalid = error != null && error !== '';
  const cards = variant === 'cards';

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={invalid ? errorId : undefined}
      aria-required={required || undefined}
      className={cx('m-0 flex min-w-0 flex-col gap-2 border-0 p-0', className)}
    >
      <legend className={cx('text-color text-13 mb-2 flex min-h-6 items-center gap-1 p-0 font-medium', hideLabel && 'sr-only')}>
        <span>
          {label}
          {required && (
            <>
              <span aria-hidden className="text-danger ml-0.5">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </span>
        {hint}
      </legend>
      <div
        className={cx(
          cards
            ? 'grid grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-2'
            : orientation === 'horizontal'
              ? 'flex flex-wrap gap-x-5 gap-y-2'
              : 'flex flex-col gap-2.5',
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const off = disabled || option.disabled === true;
          return (
            <label
              key={option.value}
              className={cx(
                'group/radio relative flex min-w-0 items-start gap-2.5 text-sm',
                off ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                cards &&
                  cx(
                    'rounded-xl border p-3.5 transition-[border-color,background-color] duration-150',
                    'has-focus-visible:outline-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                    checked ? 'border-primary bg-highlight' : 'border-line bg-panel hover:border-field-line-hover',
                  ),
              )}
            >
              <span className={cx('relative mt-0.5 flex size-4 shrink-0', cards && 'order-last ml-auto')}>
                <input
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={checked}
                  disabled={off}
                  aria-invalid={invalid || undefined}
                  onChange={() => onChange(option.value)}
                  className="peer absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
                />
                <span
                  aria-hidden
                  className={cx(
                    'bg-field pointer-events-none flex size-4 items-center justify-center rounded-full border transition-colors duration-150',
                    !cards && 'peer-focus-visible:outline-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
                    checked ? 'border-primary' : invalid ? 'border-danger' : 'border-field-line group-hover/radio:border-field-line-hover',
                  )}
                >
                  <span
                    className={cx(
                      'bg-primary size-2 rounded-full transition-transform duration-200 ease-[var(--ease-out-quint)]',
                      checked ? 'scale-100' : 'scale-0',
                    )}
                  />
                </span>
              </span>
              {option.icon !== undefined && (
                <i className={cx(`icon icon-${option.icon} mt-0.5 shrink-0`, checked ? 'text-primary' : 'text-muted-color')} aria-hidden />
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cx('text-color leading-5', cards && 'font-medium')}>{option.label}</span>
                {option.description !== undefined && <span className="text-muted-color text-xs leading-relaxed">{option.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        {invalid && (
          <p id={errorId} className="text-danger-ink text-13 animate-tip-in flex items-start gap-1.5">
            <i className="icon icon-circle-alert mt-[0.2rem] shrink-0 text-xs" aria-hidden />
            <span>{error}</span>
          </p>
        )}
      </div>
    </fieldset>
  );
}
