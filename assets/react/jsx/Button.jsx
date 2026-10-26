const cx = (...parts) => parts.filter(Boolean).join(' ');
const BASE =
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg font-semibold whitespace-nowrap outline-none select-none transition-[background-color,border-color,color,box-shadow,scale] duration-150 enabled:active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const VARIANT = {
  primary: 'bg-primary text-primary-contrast shadow-card hover:bg-primary/90',
  outlined: 'border-line bg-panel text-color border hover:border-field-line hover:bg-sunken',
  text: 'text-muted-color hover:bg-sunken hover:text-color',
  soft: 'bg-highlight text-highlight-ink hover:bg-primary/15',
  danger: 'bg-danger shadow-card text-white hover:bg-danger/90 dark:text-surface-950',
  'danger-text': 'text-danger-ink hover:bg-danger-soft',
};
const SIZE = {
  sm: { box: 'h-8 gap-1.5 px-3 text-13', square: 'size-8 text-13', icon: 'text-sm' },
  md: { box: 'h-9 gap-2 px-4 text-sm', square: 'size-9 text-sm', icon: 'text-[0.95rem]' },
  lg: { box: 'h-11 gap-2 px-5 text-[0.9375rem]', square: 'size-11 text-base', icon: 'text-base' },
};
export function buttonClass({ variant = 'outlined', size = 'md', iconOnly = false, className } = {}) {
  return cx(BASE, VARIANT[variant], iconOnly ? SIZE[size].square : SIZE[size].box, className);
}
export function Button({
  variant = 'outlined',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  loadingLabel,
  label,
  children,
  className,
  type = 'button',
  title,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}) {
  const iconOnly = children === undefined || children === null || children === false;
  const spinner = loading && (icon !== undefined || loadingLabel === undefined || iconOnly);
  const shownIcon = spinner ? 'loader-circle' : icon;
  const text = loading && loadingLabel !== undefined ? loadingLabel : children;
  return (
    <button
      {...rest}
      type={type}
      title={iconOnly ? (title ?? label) : title}
      aria-label={iconOnly ? (ariaLabel ?? label) : ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      className={buttonClass({ variant, size, iconOnly, className })}
    >
      {shownIcon !== undefined && <i className={cx(`icon icon-${shownIcon}`, SIZE[size].icon, spinner && 'animate-spin')} aria-hidden />}
      {!iconOnly && <span className="min-w-0 truncate">{text}</span>}
      {iconEnd !== undefined && !iconOnly && <i className={cx(`icon icon-${iconEnd}`, SIZE[size].icon)} aria-hidden />}
    </button>
  );
}
