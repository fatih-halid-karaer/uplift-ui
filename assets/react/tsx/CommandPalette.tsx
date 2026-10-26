import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { DIALOG_ELEMENT } from './Dialog';
import { useModal } from './overlay';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface Command {
  id: string;
  label: string;
  group?: string;
  icon?: string;
  hint?: string;
  keywords?: readonly string[];
  shortcut?: string;
  onRun: () => void;
}

interface Match {
  command: Command;
  score: number;
  hits: readonly number[];
}

interface Section {
  key: string;
  label: string;
  matches: readonly Match[];
}

export function fuzzyScore(query: string, text: string): { score: number; hits: number[] } | null {
  const needle = query.toLowerCase().replace(/\s+/g, ' ').trim();
  if (needle === '') return { score: 0, hits: [] };
  const hay = text.toLowerCase();
  const exact = hay.indexOf(needle);
  if (exact !== -1) {
    const boundary = exact === 0 || /[\s\-_/.:]/.test(hay.charAt(exact - 1));
    return {
      score: 40 + needle.length * 6 + (exact === 0 ? 20 : boundary ? 10 : 0) - hay.length * 0.05,
      hits: Array.from({ length: needle.length }, (_, index) => exact + index),
    };
  }
  const hits: number[] = [];
  let score = 0;
  let from = 0;
  let previous = -2;
  for (const char of needle.replace(/ /g, '')) {
    const at = hay.indexOf(char, from);
    if (at === -1) return null;
    const boundary = at === 0 || /[\s\-_/.:]/.test(hay.charAt(at - 1));
    score += at === previous + 1 ? 5 : boundary ? 4 : 1;
    score -= Math.min(2, (at - from) * 0.08);
    hits.push(at);
    previous = at;
    from = at + 1;
  }
  return { score: score - hay.length * 0.05, hits };
}

function rank(commands: readonly Command[], query: string): Match[] {
  const out: Match[] = [];
  for (const command of commands) {
    const main = fuzzyScore(query, command.label);
    if (main !== null) {
      out.push({ command, score: main.score, hits: main.hits });
      continue;
    }
    let best = Number.NEGATIVE_INFINITY;
    for (const extra of [...(command.keywords ?? []), command.group ?? '', command.hint ?? '']) {
      if (extra === '') continue;
      const found = fuzzyScore(query, extra);
      if (found !== null && found.score > best) best = found.score;
    }
    if (best > Number.NEGATIVE_INFINITY) out.push({ command, score: best * 0.6, hits: [] });
  }
  return out.sort((a, b) => b.score - a.score);
}

function grouped(matches: readonly Match[], fallback: string): Section[] {
  const order: string[] = [];
  const buckets = new Map<string, Match[]>();
  for (const match of matches) {
    const key = match.command.group ?? fallback;
    const bucket = buckets.get(key);
    if (bucket === undefined) {
      order.push(key);
      buckets.set(key, [match]);
    } else bucket.push(match);
  }
  return order.map((key) => ({ key: `group-${key}`, label: key, matches: buckets.get(key) ?? [] }));
}

function Highlight({ text, hits }: Readonly<{ text: string; hits: readonly number[] }>) {
  if (hits.length === 0) return <>{text}</>;
  const marked = new Set(hits);
  const parts: ReactNode[] = [];
  let run = '';
  let runMarked = false;
  const flush = (index: number) => {
    if (run === '') return;
    parts.push(
      runMarked ? (
        <mark key={index} className="text-primary bg-transparent font-semibold">
          {run}
        </mark>
      ) : (
        run
      ),
    );
    run = '';
  };
  [...text].forEach((char, index) => {
    const hit = marked.has(index);
    if (hit !== runMarked) {
      flush(index);
      runMarked = hit;
    }
    run += char;
  });
  flush(text.length);
  return <>{parts}</>;
}

export const isMacLike = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const KBD =
  'border-line bg-subtle text-muted-color inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[0.6875rem] leading-none';

interface CommandPaletteProps {
  commands: readonly Command[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recent?: readonly Command[];
  hotkey?: boolean;
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  emptyHint?: string;
  recentLabel?: string;
  otherLabel?: string;
  limit?: number;
}

export function CommandPalette({
  commands,
  open,
  onOpenChange,
  recent = [],
  hotkey = true,
  label = 'Command palette',
  placeholder = 'Search pages and actions…',
  emptyLabel = 'Nothing matches',
  emptyHint = 'Try a shorter word or check the spelling.',
  recentLabel = 'Recent',
  otherLabel = 'Actions',
  limit = 50,
}: Readonly<CommandPaletteProps>) {
  const listId = useId();
  const optionPrefix = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const latest = useRef({ open, onOpenChange });
  const { mounted, leaving, dialogProps, requestClose } = useModal(open, () => onOpenChange(false), { exitMs: 160 });

  useEffect(() => {
    latest.current = { open, onOpenChange };
  });

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      latest.current.onOpenChange(!latest.current.open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
  }, [open]);

  const sections = useMemo<Section[]>(() => {
    if (query.trim() === '') {
      const top: Section[] =
        recent.length > 0
          ? [{ key: 'recent', label: recentLabel, matches: recent.map((command) => ({ command, score: 0, hits: [] })) }]
          : [];
      return [
        ...top,
        ...grouped(
          commands.map((command) => ({ command, score: 0, hits: [] })),
          otherLabel,
        ),
      ];
    }
    return grouped(rank(commands, query).slice(0, limit), otherLabel);
  }, [commands, recent, query, recentLabel, otherLabel, limit]);

  const flat = useMemo(
    () =>
      sections.flatMap((section) =>
        section.matches.map((match) => ({ ...match, id: `${optionPrefix}-${section.key}-${match.command.id}` })),
      ),
    [sections, optionPrefix],
  );
  const current = flat[Math.min(active, flat.length - 1)];

  useEffect(() => {
    if (current === undefined) return;
    document.getElementById(current.id)?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const run = (command: Command) => {
    requestClose();
    command.onRun();
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return;
    const last = flat.length - 1;
    const index = Math.min(active, last);
    if (event.key === 'ArrowDown' || (event.key === 'n' && event.ctrlKey)) {
      event.preventDefault();
      setActive(index >= last ? 0 : index + 1);
    } else if (event.key === 'ArrowUp' || (event.key === 'p' && event.ctrlKey)) {
      event.preventDefault();
      setActive(index <= 0 ? last : index - 1);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      setActive(Math.min(last, index + 5));
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      setActive(Math.max(0, index - 5));
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing && current !== undefined) {
      event.preventDefault();
      run(current.command);
    }
  };

  if (!mounted) return null;

  let position = -1;

  return (
    <dialog
      {...dialogProps}
      aria-label={label}
      className={cx(
        DIALOG_ELEMENT,
        'sm:mt-[12vh] sm:mb-auto',
        'max-sm:m-0 max-sm:h-dvh',
        leaving ? 'backdrop:animate-scrim-out' : 'backdrop:animate-scrim-in',
      )}
    >
      <div
        data-modal-surface
        tabIndex={-1}
        className={cx(
          'border-line bg-panel shadow-float flex max-h-[min(34rem,76dvh)] w-[min(40rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border outline-none',
          'max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:rounded-none max-sm:border-0',
          'max-sm:transition-[translate,opacity] max-sm:starting:translate-y-4 max-sm:starting:opacity-0',
          leaving
            ? 'sm:animate-popup-out max-sm:opacity-0 max-sm:duration-150'
            : 'sm:animate-popup-in max-sm:duration-300 max-sm:ease-[var(--ease-out-quint)]',
        )}
      >
        <div className="border-line-soft flex h-14 shrink-0 items-center gap-3 border-b pr-2 pl-4 sm:pr-4">
          <i className="icon icon-search text-muted-color shrink-0 text-base" aria-hidden />
          <input
            data-autofocus
            role="combobox"
            aria-label={label}
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={current?.id}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder={placeholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            className="text-color placeholder:text-muted-color h-full min-w-0 flex-1 bg-transparent text-base outline-none sm:text-[0.9375rem]"
          />
          <kbd className={cx(KBD, 'max-sm:hidden')}>Esc</kbd>
          <button
            type="button"
            onClick={requestClose}
            className="text-primary hover:bg-sunken h-10 shrink-0 cursor-pointer rounded-lg px-3 text-sm font-semibold sm:hidden"
          >
            Cancel
          </button>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {query.trim() === '' ? '' : `${flat.length} ${flat.length === 1 ? 'result' : 'results'}`}
        </p>

        {flat.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-6 py-12 text-center">
            <span aria-hidden className="bg-sunken text-muted-color mb-2 flex size-11 items-center justify-center rounded-full">
              <i className="icon icon-search-x text-lg" />
            </span>
            <p className="text-color text-sm font-semibold">{emptyLabel}</p>
            <p className="text-muted-color text-13">{emptyHint}</p>
          </div>
        ) : (
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]"
          >
            {sections.map((section) => {
              const headingId = `${optionPrefix}-${section.key}-heading`;
              return (
                <div key={section.key} role="group" aria-labelledby={headingId} className="pb-1">
                  <div
                    id={headingId}
                    className="text-muted-color px-2.5 pt-2.5 pb-1.5 text-[0.6875rem] font-semibold tracking-wider uppercase"
                  >
                    {section.label}
                  </div>
                  {section.matches.map((match) => {
                    position += 1;
                    const index = position;
                    const item = flat[index];
                    const selected = item !== undefined && item.id === current?.id;
                    return (
                      <div
                        key={item?.id ?? match.command.id}
                        id={item?.id}
                        role="option"
                        aria-selected={selected}
                        onPointerMove={() => {
                          if (!selected) setActive(index);
                        }}
                        onClick={() => run(match.command)}
                        className={cx(
                          'flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100 [@media(pointer:coarse)]:min-h-12',
                          selected ? 'bg-highlight text-highlight-ink' : 'text-color',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cx(
                            'flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-100',
                            selected ? 'border-primary/25 bg-panel text-primary' : 'border-line-soft bg-subtle text-muted-color',
                          )}
                        >
                          <i className={`icon icon-${match.command.icon ?? 'corner-down-right'} text-sm`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            <Highlight text={match.command.label} hits={match.hits} />
                          </span>
                          {match.command.hint !== undefined && (
                            <span className="text-muted-color block truncate text-xs">{match.command.hint}</span>
                          )}
                        </span>
                        {match.command.shortcut !== undefined && <kbd className={cx(KBD, 'max-sm:hidden')}>{match.command.shortcut}</kbd>}
                        <i
                          aria-hidden
                          className={cx(
                            'icon icon-corner-down-left text-primary shrink-0 text-sm transition-opacity duration-100 max-sm:hidden',
                            selected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="border-line-soft text-muted-color flex shrink-0 items-center gap-4 border-t px-4 py-2 text-xs max-sm:hidden">
          <span className="flex items-center gap-1.5">
            <kbd className={KBD}>↑</kbd>
            <kbd className={KBD}>↓</kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className={KBD}>↵</kbd>
            to open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className={KBD}>{isMacLike() ? '⌘' : 'Ctrl'}</kbd>
            <kbd className={KBD}>K</kbd>
            to toggle
          </span>
        </div>
      </div>
    </dialog>
  );
}

interface CommandPaletteButtonProps {
  onClick: () => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function CommandPaletteButton({ onClick, label = 'Search…', compact = false, className }: Readonly<CommandPaletteButtonProps>) {
  const mac = isMacLike();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={compact ? label : undefined}
      aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}
      title={compact ? label : undefined}
      className={cx(
        'border-line bg-panel text-muted-color hover:border-field-line hover:text-color flex h-9 cursor-pointer items-center gap-2 rounded-lg border text-sm transition-colors duration-150',
        compact ? 'w-10 justify-center' : 'w-full px-3',
        className,
      )}
    >
      <i className="icon icon-search shrink-0 text-sm" aria-hidden />
      {!compact && (
        <>
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <span className="flex shrink-0 items-center gap-0.5 max-sm:hidden" aria-hidden>
            <kbd className={KBD}>{mac ? '⌘' : 'Ctrl'}</kbd>
            <kbd className={KBD}>K</kbd>
          </span>
        </>
      )}
    </button>
  );
}
