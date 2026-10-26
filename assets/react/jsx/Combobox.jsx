import { useEffect, useId, useRef, useState } from 'react';
import { bareInput, fieldShell, useFieldControl } from './Field';
import { floatIn, useDismiss, useFloating } from './floating';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function filterOptions(options, query) {
  const needle = query.trim().toLowerCase();
  if (needle === '') return options;
  return options.filter((option) => option.label.toLowerCase().includes(needle) || option.description?.toLowerCase().includes(needle));
}
export function Highlight({ text, query }) {
  const needle = query.trim().toLowerCase();
  const at = needle === '' ? -1 : text.toLowerCase().indexOf(needle);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="text-primary bg-transparent font-semibold">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}
function stepIndex(list, from, direction) {
  if (list.length === 0) return -1;
  let index = from;
  for (let tries = 0; tries < list.length; tries++) {
    index = (index + direction + list.length) % list.length;
    if (list[index]?.disabled !== true) return index;
  }
  return -1;
}
export function Combobox(props) {
  const {
    options,
    placeholder,
    label,
    invalid,
    disabled = false,
    clearable = true,
    emptyText = 'No options',
    noMatchText = (query) => `No match for “${query}”`,
    className,
  } = props;
  const control = useFieldControl({ id: props.id, invalid });
  const listId = useId();
  const shell = useRef(null);
  const input = useRef(null);
  const panel = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [announce, setAnnounce] = useState('');
  const { style, side } = useFloating(open, shell, panel, { matchWidth: true });
  const chosen = props.multiple === true ? props.value : props.value === null ? [] : [props.value];
  const chosenSet = new Set(chosen);
  const byValue = new Map(options.map((option) => [option.value, option]));
  const current = props.multiple === true || props.value === null ? undefined : byValue.get(props.value);
  const visible = filterOptions(options, query);
  const optionId = (index) => `${listId}-option-${index}`;
  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(-1);
  };
  useDismiss(open, [shell, panel], close, { escape: false });
  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);
  const show = (direction = 1) => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = visible.findIndex((option) => chosenSet.has(option.value));
    setActive(selectedIndex >= 0 ? selectedIndex : stepIndex(visible, direction === 1 ? -1 : 0, direction));
  };
  const pick = (option) => {
    if (option === undefined || option.disabled === true) return;
    if (props.multiple === true) {
      const has = props.value.includes(option.value);
      props.onChange(has ? props.value.filter((item) => item !== option.value) : [...props.value, option.value]);
      setAnnounce(`${option.label} ${has ? 'removed' : 'added'}`);
      setQuery('');
      return;
    }
    props.onChange(option.value);
    close();
  };
  const remove = (value) => {
    if (props.multiple !== true) return;
    props.onChange(props.value.filter((item) => item !== value));
    setAnnounce(`${byValue.get(value)?.label ?? value} removed`);
  };
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) show(direction);
      else setActive((index) => stepIndex(visible, index, direction));
    } else if (event.key === 'Enter') {
      if (!open || active < 0) return;
      event.preventDefault();
      pick(visible[active]);
    } else if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      if (open) close();
    } else if (event.key === 'Backspace' && props.multiple === true && query === '') {
      const last = props.value[props.value.length - 1];
      if (last !== undefined) remove(last);
    }
  };
  const hasValue = chosen.length > 0;
  const shownText = props.multiple === true ? query : open ? query : (current?.label ?? '');
  const shownPlaceholder =
    props.multiple === true ? (hasValue ? '' : placeholder) : open && current !== undefined ? current.label : placeholder;
  return (
    <div className={cx('relative min-w-0', className)}>
      <div
        ref={shell}
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget || disabled) return;
          event.preventDefault();
          input.current?.focus();
          if (!open) show();
        }}
        className={cx(
          fieldShell(control.invalid),
          'flex min-h-9 w-full items-center gap-1 py-1 pr-1 pl-2.5',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {props.multiple === true &&
            props.value.map((value) => {
              const text = byValue.get(value)?.label ?? value;
              return (
                <span
                  key={value}
                  className="bg-sunken text-color text-13 inline-flex h-6 max-w-full items-center gap-0.5 rounded-md pr-0.5 pl-2 transition-[scale,opacity] duration-200 ease-[var(--ease-out-quint)] starting:scale-90 starting:opacity-0"
                >
                  <span className="truncate">{text}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${text}`}
                    disabled={disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => remove(value)}
                    className="text-muted-color hover:bg-line hover:text-color flex size-5 cursor-pointer items-center justify-center rounded transition-colors duration-150"
                  >
                    <i className="icon icon-x text-[0.7rem]" aria-hidden />
                  </button>
                </span>
              );
            })}
          <input
            ref={input}
            id={control.id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-label={label}
            aria-invalid={control.invalid || undefined}
            aria-describedby={control.describedBy}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={shownText}
            placeholder={shownPlaceholder}
            onClick={() => {
              if (!open) show();
            }}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              setActive(stepIndex(filterOptions(options, next), -1, 1));
            }}
            onKeyDown={onKeyDown}
            onBlur={(event) => {
              const next = event.relatedTarget;
              if (next === null || (!shell.current?.contains(next) && !panel.current?.contains(next))) close();
            }}
            className={cx(bareInput, 'h-7 min-w-16 px-0.5')}
          />
        </div>
        {props.multiple !== true && clearable && hasValue && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              props.onChange(null);
              input.current?.focus();
            }}
            className="text-muted-color hover:bg-sunken hover:text-color flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150"
          >
            <i className="icon icon-x text-xs" aria-hidden />
          </button>
        )}
        <i
          aria-hidden
          className={cx(
            'icon icon-chevron-down text-muted-color pointer-events-none mr-1.5 shrink-0 text-xs transition-transform duration-200 ease-[var(--ease-out-quint)]',
            open && 'rotate-180',
          )}
        />
      </div>

      {open && (
        <div
          ref={panel}
          style={style}
          className={cx('border-line bg-panel shadow-float z-50 flex flex-col overflow-hidden rounded-xl border p-1', floatIn(side))}
        >
          <ul
            id={listId}
            role="listbox"
            aria-label={label ?? 'Options'}
            aria-multiselectable={props.multiple === true || undefined}
            className="flex max-h-72 min-h-0 flex-col gap-px overflow-y-auto overscroll-contain"
          >
            {visible.map((option, index) => {
              const selected = chosenSet.has(option.value);
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled === true || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => {
                    if (index !== active && option.disabled !== true) setActive(index);
                  }}
                  onClick={() => pick(option)}
                  className={cx(
                    'text-13 flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors duration-100 sm:min-h-8',
                    index === active && 'bg-sunken',
                    selected ? 'text-primary font-medium' : 'text-color',
                    option.disabled === true && 'cursor-not-allowed opacity-45',
                  )}
                >
                  {props.multiple === true && (
                    <span
                      aria-hidden
                      className={cx(
                        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150',
                        selected ? 'bg-primary border-primary text-primary-contrast' : 'border-field-line bg-field',
                      )}
                    >
                      {selected && <i className="icon icon-check text-[0.65rem]" />}
                    </span>
                  )}
                  {option.icon !== undefined && <i className={`icon icon-${option.icon} text-muted-color shrink-0 text-sm`} aria-hidden />}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      <Highlight text={option.label} query={query} />
                    </span>
                    {option.description !== undefined && (
                      <span className="text-muted-color truncate text-xs font-normal">{option.description}</span>
                    )}
                  </span>
                  {props.multiple !== true && selected && <i className="icon icon-check text-primary shrink-0 text-sm" aria-hidden />}
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && (
            <p role="status" className="text-muted-color text-13 flex items-center gap-2 px-2.5 py-2">
              <i className={`icon icon-${options.length === 0 ? 'inbox' : 'search-x'} text-sm`} aria-hidden />
              {options.length === 0 ? emptyText : noMatchText(query.trim())}
            </p>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
