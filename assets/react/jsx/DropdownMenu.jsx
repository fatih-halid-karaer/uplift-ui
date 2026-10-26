import { useCallback, useId, useRef, useState } from 'react';
import { focusQuietly } from './overlay';
import { FloatingPanel } from './Popover';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const isAction = (entry) => entry.kind === undefined || entry.kind === 'item';
const TYPEAHEAD_MS = 600;
export function DropdownMenu({ trigger, items, label, side = 'bottom', align = 'start', className }) {
  const anchor = useRef(null);
  const refs = useRef(new Map());
  const startAt = useRef('first');
  const typed = useRef({ text: '', at: 0 });
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const enabled = items.filter(isAction).filter((item) => item.disabled !== true);
  const attach = useCallback((node) => {
    anchor.current = node;
  }, []);
  const focusItem = (id) => {
    if (id === undefined) return;
    setActive(id);
    focusQuietly(refs.current.get(id));
  };
  const show = (from) => {
    startAt.current = from;
    setOpen(true);
  };
  const dismiss = (restore) => {
    setOpen(false);
    setActive(null);
    if (restore) focusQuietly(anchor.current);
  };
  const choose = (item) => {
    dismiss(true);
    item.onSelect();
  };
  const onMenuKey = (event) => {
    const ids = enabled.map((item) => item.id);
    if (ids.length === 0) return;
    const index = active === null ? -1 : ids.indexOf(active);
    const last = ids.length - 1;
    const moves = {
      ArrowDown: index >= last ? 0 : index + 1,
      ArrowUp: index <= 0 ? last : index - 1,
      Home: 0,
      End: last,
      PageUp: 0,
      PageDown: last,
    };
    const target = moves[event.key];
    if (target !== undefined) {
      event.preventDefault();
      focusItem(ids[target]);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      dismiss(true);
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || event.key === ' ') return;
    const now = Date.now();
    const char = event.key.toLowerCase();
    const text = now - typed.current.at < TYPEAHEAD_MS ? typed.current.text + char : char;
    typed.current = { text, at: now };
    const repeated = [...text].every((letter) => letter === char);
    const needle = repeated ? char : text;
    const order = [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
    const pool = repeated || text.length === 1 ? order : [...enabled.slice(Math.max(index, 0)), ...enabled.slice(0, Math.max(index, 0))];
    const hit = pool.find((item) => item.label.toLowerCase().startsWith(needle));
    if (hit !== undefined) {
      event.preventDefault();
      focusItem(hit.id);
    }
  };
  return (
    <>
      {trigger({
        ref: attach,
        onClick: () => (open ? dismiss(false) : show('first')),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show(event.key === 'ArrowDown' ? 'first' : 'last');
          }
        },
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        'aria-haspopup': 'menu',
      })}
      <FloatingPanel
        open={open}
        anchor={anchor}
        id={menuId}
        role="menu"
        label={label}
        side={side}
        align={align}
        onKeyDown={onMenuKey}
        onOpened={() => focusItem(startAt.current === 'first' ? enabled[0]?.id : enabled[enabled.length - 1]?.id)}
        onDismiss={(reason) => dismiss(reason === 'escape')}
        className={cx('min-w-48 p-1.5', className)}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {items.map((entry) => {
            if (entry.kind === 'separator') return <div key={entry.id} role="separator" className="bg-line-soft -mx-1.5 my-1.5 h-px" />;
            if (entry.kind === 'heading')
              return (
                <div
                  key={entry.id}
                  role="presentation"
                  className="text-muted-color px-2.5 pt-2 pb-1 text-[0.6875rem] font-semibold tracking-wider uppercase"
                >
                  {entry.label}
                </div>
              );
            const danger = entry.danger === true;
            return (
              <button
                key={entry.id}
                ref={(node) => {
                  if (node === null) refs.current.delete(entry.id);
                  else refs.current.set(entry.id, node);
                }}
                type="button"
                role="menuitem"
                tabIndex={active === entry.id ? 0 : -1}
                disabled={entry.disabled}
                onClick={() => choose(entry)}
                onPointerMove={() => {
                  if (active !== entry.id && entry.disabled !== true) focusItem(entry.id);
                }}
                className={cx(
                  'flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-sm outline-none transition-colors duration-100 select-none [@media(pointer:coarse)]:h-11',
                  'disabled:cursor-default disabled:opacity-45',
                  danger ? 'text-danger-ink focus:bg-danger-soft' : 'text-color focus:bg-sunken',
                )}
              >
                {entry.icon !== undefined && (
                  <i
                    className={cx(`icon icon-${entry.icon} shrink-0 text-[0.95rem]`, danger ? 'text-danger' : 'text-muted-color')}
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {entry.hint !== undefined && <span className="text-muted-color text-xs">{entry.hint}</span>}
                {entry.shortcut !== undefined && (
                  <kbd className="text-muted-color ml-3 font-mono text-[0.6875rem] tracking-wide max-sm:hidden">{entry.shortcut}</kbd>
                )}
              </button>
            );
          })}
        </div>
      </FloatingPanel>
    </>
  );
}
