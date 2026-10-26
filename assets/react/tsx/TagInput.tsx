import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

import { bareInput, fieldShell, useFieldControl } from './Field';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface TagInputProps {
  value: readonly string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  max?: number;
  validate?: (tag: string) => string | null;
  transform?: (raw: string) => string;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  mono?: boolean;
  className?: string;
}

const SPLIT = /[,\n\t;]+/;

export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  label,
  max,
  validate,
  transform = (raw) => raw.trim(),
  id,
  invalid,
  disabled = false,
  mono = false,
  className,
}: Readonly<TagInputProps>) {
  const control = useFieldControl({ id, invalid });
  const messageId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const add = (raws: readonly string[]) => {
    const next = [...value];
    const seen = new Set(value.map((tag) => tag.toLowerCase()));
    let issue: string | null = null;
    for (const raw of raws) {
      const tag = transform(raw);
      if (tag === '') continue;
      if (seen.has(tag.toLowerCase())) {
        issue = `“${tag}” is already added`;
        continue;
      }
      if (max !== undefined && next.length >= max) {
        issue = `Up to ${max} ${max === 1 ? 'item' : 'items'}`;
        break;
      }
      const verdict = validate?.(tag) ?? null;
      if (verdict !== null) {
        issue = verdict;
        continue;
      }
      seen.add(tag.toLowerCase());
      next.push(tag);
    }
    setProblem(issue);
    if (next.length !== value.length) {
      onChange(next);
      setAnnounce(`${next.slice(value.length).join(', ')} added`);
    }
    return issue === null;
  };

  const remove = (index: number) => {
    const tag = value[index];
    if (tag === undefined) return;
    onChange(value.filter((_, i) => i !== index));
    setAnnounce(`${tag} removed`);
    setProblem(null);
    input.current?.focus();
  };

  const commit = () => {
    if (draft.trim() === '') return;
    if (add([draft])) setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      if (draft.trim() === '') return;
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      event.preventDefault();
      remove(value.length - 1);
    } else if (event.key === 'Escape' && draft !== '') {
      event.preventDefault();
      setDraft('');
      setProblem(null);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!SPLIT.test(text)) return;
    event.preventDefault();
    add(text.split(SPLIT));
  };

  const full = max !== undefined && value.length >= max;

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <div
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          input.current?.focus();
        }}
        className={cx(
          fieldShell(control.invalid || problem !== null),
          'flex min-h-9 flex-wrap items-center gap-1 px-1.5 py-1',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text',
        )}
      >
        {value.map((tag, index) => (
          <span
            key={tag}
            className={cx(
              'bg-sunken text-color text-13 inline-flex h-6 max-w-full items-center gap-0.5 rounded-md pr-0.5 pl-2',
              'transition-[scale,opacity] duration-200 ease-[var(--ease-out-quint)] starting:scale-90 starting:opacity-0',
              mono && 'font-mono',
            )}
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => remove(index)}
              className="text-muted-color hover:bg-line hover:text-color flex size-5 cursor-pointer items-center justify-center rounded transition-colors duration-150"
            >
              <i className="icon icon-x text-[0.7rem]" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={input}
          id={control.id}
          type="text"
          value={draft}
          disabled={disabled}
          readOnly={full}
          placeholder={full ? '' : value.length === 0 ? placeholder : ''}
          aria-label={label}
          aria-invalid={control.invalid || problem !== null || undefined}
          aria-describedby={[control.describedBy, problem !== null ? messageId : undefined].filter(Boolean).join(' ') || undefined}
          enterKeyHint="done"
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value);
            if (problem !== null) setProblem(null);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={commit}
          className={cx(bareInput, 'h-7 min-w-24 px-1.5', mono && 'font-mono')}
        />
      </div>
      {problem !== null && (
        <p id={messageId} className="text-danger-ink animate-tip-in flex items-center gap-1.5 text-xs">
          <i className="icon icon-circle-alert shrink-0" aria-hidden />
          {problem}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
