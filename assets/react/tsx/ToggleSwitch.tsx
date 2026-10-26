const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false, className }: Readonly<ToggleSwitchProps>) {
  return (
    <span className={cx('relative inline-flex shrink-0', className)}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className={cx(
          'flex h-6 w-11 items-center rounded-full border p-0.5 shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] transition-colors duration-200',
          'peer-focus-visible:outline-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          checked ? 'bg-primary border-primary peer-hover:bg-primary/90' : 'bg-line peer-hover:bg-field-line-hover border-transparent',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cx(
            'bg-panel relative flex size-[1.125rem] items-center justify-center rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform duration-300 ease-[var(--ease-out-quint)]',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        >
          <i
            className={cx(
              'icon icon-check text-primary absolute text-[0.7rem] transition-[opacity,scale] duration-200',
              checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
          <i
            className={cx(
              'icon icon-x text-muted-color absolute text-[0.6rem] transition-[opacity,scale] duration-200',
              checked ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
            )}
          />
        </span>
      </span>
    </span>
  );
}
