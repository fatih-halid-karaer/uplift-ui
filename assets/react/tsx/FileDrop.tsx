import { useId, useRef, useState, type DragEvent } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export function formatBytes(bytes: number, locale?: string) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[unit]}`;
}

export function matchesAccept(file: File, accept: string | undefined) {
  if (accept === undefined || accept.trim() === '') return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .some((rule) => {
      if (rule === '') return false;
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

const describeAccept = (accept: string | undefined) =>
  accept === undefined
    ? undefined
    : accept
        .split(',')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) => (rule.startsWith('.') ? rule.slice(1).toUpperCase() : rule.endsWith('/*') ? `${rule.slice(0, -2)} files` : rule))
        .join(', ');

const iconFor = (file: File) => {
  if (file.type.startsWith('image/')) return 'file-image';
  if (file.type.startsWith('video/')) return 'file-video';
  if (file.type.startsWith('audio/')) return 'file-audio';
  if (/\.(zip|gz|tar|rar|7z)$/i.test(file.name)) return 'file-archive';
  if (/\.(csv|xlsx?|ods)$/i.test(file.name)) return 'file-spreadsheet';
  if (/\.(json|ya?ml|xml|js|ts|py|sh)$/i.test(file.name)) return 'file-code';
  return 'file-text';
};

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

interface Rejection {
  name: string;
  reason: string;
}

interface FileDropProps {
  files: readonly File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  hint?: string;
  id?: string;
  invalid?: boolean;
  className?: string;
}

export function FileDrop({
  files,
  onChange,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  disabled = false,
  title,
  hint,
  id,
  invalid = false,
  className,
}: Readonly<FileDropProps>) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const problemsId = `${inputId}-problems`;
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  const limit = multiple ? maxFiles : 1;

  const autoHint = [
    describeAccept(accept),
    maxSize !== undefined && `up to ${formatBytes(maxSize)} each`,
    limit !== undefined && limit > 1 && `max ${limit} files`,
  ]
    .filter(Boolean)
    .join(' · ');

  const add = (incoming: readonly File[]) => {
    const next = multiple ? [...files] : [];
    const seen = new Set(next.map(fileKey));
    const problems: Rejection[] = [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) problems.push({ name: file.name, reason: `type not allowed (${describeAccept(accept)})` });
      else if (maxSize !== undefined && file.size > maxSize)
        problems.push({ name: file.name, reason: `larger than ${formatBytes(maxSize)}` });
      else if (seen.has(fileKey(file))) problems.push({ name: file.name, reason: 'already added' });
      else if (limit !== undefined && next.length >= limit) {
        if (!multiple) next.splice(0, next.length, file);
        else problems.push({ name: file.name, reason: `limit of ${limit} files reached` });
      } else {
        next.push(file);
        seen.add(fileKey(file));
      }
    }
    setRejected(problems);
    if (next.length !== files.length || next.some((file, index) => file !== files[index])) onChange(next);
  };

  const remove = (target: File) => {
    onChange(files.filter((file) => file !== target));
    setRejected([]);
    input.current?.focus();
  };

  const onDrag = (event: DragEvent<HTMLLabelElement>, kind: 'enter' | 'leave' | 'over' | 'drop') => {
    if (disabled) return;
    event.preventDefault();
    if (kind === 'over') {
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (kind === 'enter') depth.current += 1;
    if (kind === 'leave') depth.current = Math.max(0, depth.current - 1);
    if (kind === 'drop') {
      depth.current = 0;
      add(Array.from(event.dataTransfer.files));
    }
    setOver(depth.current > 0);
  };

  return (
    <div className={cx('flex min-w-0 flex-col', className)}>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={invalid || rejected.length > 0 || undefined}
        aria-describedby={[hintId, rejected.length > 0 && problemsId].filter(Boolean).join(' ')}
        onChange={(event) => {
          add(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        onDragEnter={(event) => onDrag(event, 'enter')}
        onDragLeave={(event) => onDrag(event, 'leave')}
        onDragOver={(event) => onDrag(event, 'over')}
        onDrop={(event) => onDrag(event, 'drop')}
        className={cx(
          'group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-7 text-center transition-[border-color,background-color] duration-200 sm:py-9',
          'peer-focus-visible:outline-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          disabled
            ? 'border-line cursor-not-allowed opacity-50'
            : over
              ? 'border-primary bg-highlight cursor-copy'
              : cx('hover:bg-subtle cursor-pointer', invalid ? 'border-danger' : 'border-field-line hover:border-field-line-hover'),
        )}
      >
        <span
          aria-hidden
          className={cx(
            'bg-panel border-line shadow-card text-primary flex size-11 items-center justify-center rounded-full border transition-transform duration-300 ease-[var(--ease-out-quint)]',
            over ? '-translate-y-1 scale-110' : 'group-hover:-translate-y-0.5',
          )}
        >
          <i className={`icon icon-${over ? 'arrow-down-to-line' : 'upload'} text-lg`} />
        </span>
        <span className="text-color text-sm font-medium">
          {over ? (
            'Drop to add'
          ) : (
            <>
              <span className="text-primary">{title ?? (multiple ? 'Choose files' : 'Choose a file')}</span>
              <span className="max-sm:hidden"> or drag {multiple ? 'them' : 'it'} here</span>
            </>
          )}
        </span>
        <span id={hintId} className="text-muted-color text-xs">
          {hint ?? autoHint}
        </span>
      </label>

      <div id={problemsId} aria-live="polite">
        {rejected.length > 0 && (
          <ul className="animate-tip-in mt-2 flex flex-col gap-1">
            {rejected.map((item, index) => (
              <li key={`${item.name}-${index}`} className="text-danger-ink text-13 flex items-start gap-1.5">
                <i className="icon icon-circle-alert mt-[0.2rem] shrink-0 text-xs" aria-hidden />
                <span className="min-w-0 break-words">
                  <span className="font-medium">{item.name}</span>: {item.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {files.length > 0 && (
        <ul aria-label="Selected files" className="mt-3 flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={fileKey(file)}
              className="border-line bg-panel flex items-center gap-3 rounded-lg border py-2 pr-1.5 pl-2.5 transition-[opacity,translate] duration-200 ease-[var(--ease-out-quint)] starting:translate-y-1 starting:opacity-0"
            >
              <span aria-hidden className="bg-sunken text-muted-color flex size-8 shrink-0 items-center justify-center rounded-md">
                <i className={`icon icon-${iconFor(file)} text-sm`} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-color text-13 truncate font-medium" title={file.name}>
                  {file.name}
                </span>
                <span className="text-muted-color text-xs tabular-nums">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                title="Remove"
                disabled={disabled}
                onClick={() => remove(file)}
                className="text-muted-color hover:bg-danger-soft hover:text-danger-ink flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
              >
                <i className="icon icon-x text-sm" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
