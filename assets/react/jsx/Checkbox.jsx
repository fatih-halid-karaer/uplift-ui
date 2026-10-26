import { useEffect, useId, useRef } from 'react';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function Checkbox({
  checked,
  onChange,
  label,
  hideLabel = false,
  description,
  disabled = false,
  invalid = false,
  id,
  name,
  value,
  className,
}) {
  const input = useRef(null);
  const auto = useId();
  const inputId = id ?? auto;
  const descriptionId = `${inputId}-description`;
  const on = checked !== false;
  useEffect(() => {
    if (input.current !== null) input.current.indeterminate = checked === 'mixed';
  }, [checked]);
  return (
    <label
      className={cx(
        'group/check inline-flex min-w-0 items-start gap-2.5 text-sm',
        hideLabel && 'p-1',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-4 shrink-0">
        <input
          ref={input}
          id={inputId}
          type="checkbox"
          name={name}
          value={value}
          checked={checked === true}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={description !== undefined ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
        />
        <span
          aria-hidden
          className={cx(
            'pointer-events-none flex size-4 items-center justify-center rounded-[4px] border transition-[background-color,border-color] duration-150',
            'peer-focus-visible:outline-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            on
              ? 'bg-primary border-primary text-primary-contrast group-hover/check:bg-primary/90'
              : cx('bg-field', invalid ? 'border-danger' : 'border-field-line group-hover/check:border-field-line-hover'),
          )}
        >
          {checked === 'mixed' && <i className="icon icon-minus text-[0.7rem]" />}
          {checked === true && (
            <i className="icon icon-check text-[0.7rem] transition-[scale,opacity] duration-200 ease-[var(--ease-out-quint)] starting:scale-50 starting:opacity-0" />
          )}
        </span>
      </span>
      <span className={hideLabel ? 'sr-only' : 'flex min-w-0 flex-col gap-0.5'}>
        <span className="text-color leading-5 break-words">{label}</span>
        {description !== undefined && (
          <span id={descriptionId} className="text-muted-color text-xs leading-relaxed">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
