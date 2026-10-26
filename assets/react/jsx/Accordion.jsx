import { useId, useRef, useState } from 'react';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function Accordion({
  items,
  type = 'single',
  defaultOpen = [],
  open,
  onOpenChange,
  collapsible = true,
  headingLevel = 3,
  className,
}) {
  const baseId = useId();
  const [inner, setInner] = useState(() => (type === 'single' ? defaultOpen.slice(0, 1) : [...defaultOpen]));
  const current = open ?? inner;
  const refs = useRef([]);
  const Heading = `h${headingLevel}`;
  const toggle = (id) => {
    const isOpen = current.includes(id);
    let next;
    if (type === 'single') next = isOpen ? (collapsible ? [] : [id]) : [id];
    else next = isOpen ? current.filter((value) => value !== id) : [...current, id];
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  const move = (event, index) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    const at = enabled.indexOf(index);
    const last = enabled.length - 1;
    const step = { ArrowDown: at === last ? 0 : at + 1, ArrowUp: at <= 0 ? last : at - 1, Home: 0, End: last }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    refs.current[enabled[step] ?? 0]?.focus();
  };
  return (
    <div className={cx('border-line bg-panel divide-line divide-y overflow-hidden rounded-xl border', className)}>
      {items.map((item, index) => {
        const expanded = current.includes(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;
        const locked = type === 'single' && !collapsible && expanded;
        return (
          <div key={item.id} data-open={expanded || undefined} className="group/item">
            <Heading className="m-0">
              <button
                ref={(node) => {
                  refs.current[index] = node;
                }}
                id={triggerId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-disabled={locked || undefined}
                disabled={item.disabled}
                onClick={() => !locked && toggle(item.id)}
                onKeyDown={(event) => move(event, index)}
                className={cx(
                  'text-color flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold outline-none sm:px-5',
                  'transition-colors duration-150 hover:bg-sunken/60 focus-visible:bg-highlight',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {item.icon !== undefined && (
                  <span className="bg-sunken text-muted-color group-data-open/item:bg-highlight group-data-open/item:text-primary flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200">
                    <i className={`icon icon-${item.icon} text-sm`} aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1">{item.title}</span>
                {item.meta !== undefined && (
                  <span className="text-muted-color text-13 shrink-0 font-normal max-sm:hidden">{item.meta}</span>
                )}
                <i
                  aria-hidden
                  className="icon icon-chevron-down text-muted-color shrink-0 text-sm transition-transform duration-300 ease-[var(--ease-out-quint)] group-data-open/item:rotate-180"
                />
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              inert={!expanded}
              className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[var(--ease-out-quint)] group-data-open/item:grid-rows-[1fr]"
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cx(
                    'text-muted-color text-13 px-4 pb-4 leading-relaxed transition-opacity duration-300 sm:px-5',
                    item.icon !== undefined && 'sm:pl-16',
                    expanded ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {item.meta !== undefined && <p className="text-muted-color mb-2 sm:hidden">{item.meta}</p>}
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
