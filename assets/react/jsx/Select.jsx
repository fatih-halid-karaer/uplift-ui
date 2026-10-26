import { fieldShell, useFieldControl } from './Field';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const renderOption = (option) => (
  <option key={option.value} value={option.value} disabled={option.disabled}>
    {option.label}
  </option>
);
export function Select({
  options,
  groups,
  placeholder,
  invalid,
  icon,
  size = 'md',
  className,
  selectClassName,
  id,
  required,
  children,
  'aria-describedby': describedBy,
  ...rest
}) {
  const control = useFieldControl({ id, invalid, required, describedBy });
  return (
    <div
      className={cx(
        fieldShell(control.invalid),
        'relative flex min-w-0 items-center has-disabled:opacity-50',
        size === 'sm' ? 'h-8' : 'h-9',
        className,
      )}
    >
      {icon !== undefined && <i className={`icon icon-${icon} text-muted-color pointer-events-none absolute left-3 text-sm`} aria-hidden />}
      <select
        {...rest}
        id={control.id}
        required={required}
        aria-required={control.required || undefined}
        aria-invalid={control.invalid || undefined}
        aria-describedby={control.describedBy}
        className={cx(
          'text-color h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg bg-transparent pr-9 text-base outline-none sm:text-sm',
          'disabled:cursor-not-allowed [&:has(option[value=""]:checked)]:text-muted-color [&_optgroup]:bg-panel [&_option]:bg-panel [&_option]:text-color',
          icon !== undefined ? 'pl-9' : 'pl-3',
          selectClassName,
        )}
      >
        {placeholder !== undefined && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options?.map(renderOption)}
        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map(renderOption)}
          </optgroup>
        ))}
        {children}
      </select>
      <i className="icon icon-chevrons-up-down text-muted-color pointer-events-none absolute right-3 text-xs" aria-hidden />
    </div>
  );
}
