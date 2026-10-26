import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type Ref } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldControl({
  id,
  invalid,
  required,
  describedBy,
}: {
  id?: string;
  invalid?: boolean;
  required?: boolean;
  describedBy?: string;
}) {
  const field = useContext(FieldContext);
  const fallback = useId();
  return {
    id: id ?? field?.id ?? fallback,
    invalid: invalid ?? field?.invalid ?? false,
    required: required ?? field?.required ?? false,
    describedBy: [field?.describedBy, describedBy].filter(Boolean).join(' ') || undefined,
  };
}

export const fieldShell = (invalid: boolean) =>
  cx(
    'bg-field text-color rounded-lg border transition-[border-color,box-shadow] duration-150 focus-within:ring-3',
    invalid
      ? 'border-danger focus-within:ring-danger/20'
      : 'border-field-line hover:border-field-line-hover focus-within:border-primary focus-within:ring-primary/20',
  );

export const bareInput =
  'text-color placeholder:text-muted-color/70 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm disabled:cursor-not-allowed';

export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref != null) ref.current = node;
}

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  error?: string | null;
  required?: boolean;
  id?: string;
  hideLabel?: boolean;
  className?: string;
}

export function Field({
  label,
  children,
  hint,
  description,
  aside,
  error,
  required = false,
  id,
  hideLabel = false,
  className,
}: Readonly<FieldProps>) {
  const auto = useId();
  const controlId = id ?? `${auto}-control`;
  const descriptionId = `${auto}-description`;
  const errorId = `${auto}-error`;
  const invalid = error != null && error !== '';
  const describedBy = [description !== undefined && descriptionId, invalid && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <div className={cx('flex min-h-6 items-center gap-1', hideLabel && 'sr-only')}>
        <label htmlFor={controlId} className="text-color text-13 font-medium">
          {label}
          {required && (
            <>
              <span aria-hidden className="text-danger ml-0.5">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </label>
        {hint}
        {aside !== undefined && <span className="text-muted-color ml-auto text-xs">{aside}</span>}
      </div>
      <FieldContext.Provider value={{ id: controlId, describedBy, invalid, required }}>{children}</FieldContext.Provider>
      {description !== undefined && (
        <p id={descriptionId} className="text-muted-color text-xs leading-relaxed">
          {description}
        </p>
      )}
      <div aria-live="polite">
        {invalid && (
          <p id={errorId} className="text-danger-ink text-13 animate-tip-in flex items-start gap-1.5">
            <i className="icon icon-circle-alert mt-[0.2rem] shrink-0 text-xs" aria-hidden />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export type TextInputProps = Omit<ComponentProps<'input'>, 'prefix' | 'size'> & {
  icon?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  invalid?: boolean;
  mono?: boolean;
  inputClassName?: string;
};

export function TextInput({
  icon,
  prefix,
  suffix,
  invalid,
  mono = false,
  className,
  inputClassName,
  id,
  required,
  'aria-describedby': describedBy,
  ...rest
}: Readonly<TextInputProps>) {
  const control = useFieldControl({ id, invalid, required, describedBy });
  const lead = icon !== undefined || prefix !== undefined;

  return (
    <div className={cx(fieldShell(control.invalid), 'flex h-9 min-w-0 items-center has-disabled:opacity-50', className)}>
      {lead && (
        <span className="text-muted-color pointer-events-none flex shrink-0 items-center gap-1.5 pl-3 text-sm">
          {icon !== undefined && <i className={`icon icon-${icon}`} aria-hidden />}
          {prefix}
        </span>
      )}
      <input
        {...rest}
        id={control.id}
        required={required}
        aria-required={control.required || undefined}
        aria-invalid={control.invalid || undefined}
        aria-describedby={control.describedBy}
        className={cx(
          bareInput,
          'h-full',
          lead ? 'pl-2' : 'pl-3',
          suffix !== undefined ? 'pr-1' : 'pr-3',
          mono && 'font-mono',
          inputClassName,
        )}
      />
      {suffix !== undefined && <span className="text-muted-color flex shrink-0 items-center gap-0.5 pr-1">{suffix}</span>}
    </div>
  );
}

export type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean;
  minRows?: number;
  maxRows?: number;
  autoGrow?: boolean;
  mono?: boolean;
};

export function Textarea({
  invalid,
  minRows = 3,
  maxRows = 12,
  autoGrow = true,
  mono = false,
  className,
  id,
  required,
  ref,
  onInput,
  style,
  'aria-describedby': describedBy,
  ...rest
}: Readonly<TextareaProps>) {
  const control = useFieldControl({ id, invalid, required, describedBy });
  const inner = useRef<HTMLTextAreaElement | null>(null);

  const fit = () => {
    const node = inner.current;
    if (!autoGrow || node === null) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`;
  };

  useLayoutEffect(fit, [rest.value, autoGrow]);

  return (
    <textarea
      {...rest}
      ref={(node) => {
        inner.current = node;
        assignRef(ref, node);
      }}
      id={control.id}
      required={required}
      rows={minRows}
      aria-required={control.required || undefined}
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
      onInput={(event) => {
        fit();
        onInput?.(event);
      }}
      style={{
        minHeight: `calc(${minRows} * 1.5em + 1rem + 2px)`,
        maxHeight: autoGrow ? `calc(${maxRows} * 1.5em + 1rem + 2px)` : undefined,
        ...style,
      }}
      className={cx(
        fieldShell(control.invalid),
        'placeholder:text-muted-color/70 block w-full px-3 py-2 text-base leading-normal outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        autoGrow ? 'resize-none overflow-y-auto' : 'resize-y',
        mono && 'font-mono',
        className,
      )}
    />
  );
}

export type PasswordInputProps = Omit<TextInputProps, 'type' | 'suffix'> & { revealLabel?: string };

export function PasswordInput({
  revealLabel = 'Show password',
  autoComplete = 'current-password',
  ...props
}: Readonly<PasswordInputProps>) {
  const [shown, setShown] = useState(false);

  return (
    <TextInput
      {...props}
      type={shown ? 'text' : 'password'}
      autoComplete={autoComplete}
      spellCheck={false}
      autoCapitalize="off"
      suffix={
        <button
          type="button"
          aria-label={revealLabel}
          aria-pressed={shown}
          title={shown ? 'Hide' : 'Show'}
          disabled={props.disabled}
          onClick={() => setShown((value) => !value)}
          className="text-muted-color hover:bg-sunken hover:text-color flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150"
        >
          <i className={`icon icon-${shown ? 'eye-off' : 'eye'} text-sm`} aria-hidden />
        </button>
      }
    />
  );
}
