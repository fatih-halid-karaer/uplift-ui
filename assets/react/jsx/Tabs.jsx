import { useId, useLayoutEffect, useRef, useState } from 'react';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function Tabs({ items, value, onChange, label, className }) {
  const baseId = useId();
  const list = useRef(null);
  const refs = useRef([]);
  const [bar, setBar] = useState({ opacity: 0 });
  const activeIndex = items.findIndex((item) => item.value === value);
  useLayoutEffect(() => {
    const measure = () => {
      const tab = refs.current[activeIndex];
      if (tab == null) return;
      setBar({ opacity: 1, width: tab.offsetWidth, transform: `translateX(${tab.offsetLeft}px)` });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    if (list.current !== null) observer.observe(list.current);
    return () => observer.disconnect();
  }, [activeIndex, items]);
  const move = (event, index) => {
    const last = items.length - 1;
    const target = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    refs.current[target]?.focus();
    onChange(items[target].value);
  };
  return (
    <div className={cx('flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      <div ref={list} role="tablist" aria-label={label} className="border-line relative flex w-full min-w-max gap-7 border-b px-2">
        {items.map((item, index) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => move(event, index)}
              className={cx(
                'group -mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 pt-1.5 pb-3 text-sm whitespace-nowrap outline-none transition-colors duration-150',
                'focus-visible:bg-highlight',
                active ? 'text-color font-semibold' : 'text-muted-color hover:text-color font-medium',
              )}
            >
              {item.icon !== undefined && (
                <i className={cx(`icon icon-${item.icon} text-sm transition-colors duration-150`, active && 'text-primary')} aria-hidden />
              )}
              {item.label}
              {item.count !== undefined && (
                <span className={cx('text-13 tabular-nums', active ? 'text-primary' : 'text-muted-color')}>{item.count}</span>
              )}
            </button>
          );
        })}
        <span
          aria-hidden
          style={bar}
          className="bg-primary pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full transition-[transform,width,opacity] duration-300 ease-[var(--ease-out-quint)]"
        />
      </div>
    </div>
  );
}
