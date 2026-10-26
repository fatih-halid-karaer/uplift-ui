import { useRef } from 'react';
import { useTheme } from './theme';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const CHOICES = [
  { value: 'light', label: 'Light theme', icon: 'sun' },
  { value: 'dark', label: 'Dark theme', icon: 'moon' },
  { value: 'system', label: 'Match system', icon: 'monitor' },
];
export function ThemeSwitcher({ position = 'fixed', transition = 'reveal', label = 'Colour theme', className }) {
  const [choice, setChoice] = useTheme(transition);
  const refs = useRef([]);
  const pick = (value, event) => {
    if (value === choice) return;
    const box = event.currentTarget.getBoundingClientRect();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    setChoice(value, keyboard ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: event.clientX, y: event.clientY });
  };
  const move = (event, index) => {
    const last = CHOICES.length - 1;
    const next = index === last ? 0 : index + 1;
    const prev = index === 0 ? last : index - 1;
    const target = { ArrowRight: next, ArrowDown: next, ArrowLeft: prev, ArrowUp: prev }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const node = refs.current[target];
    if (node == null) return;
    node.focus();
    const box = node.getBoundingClientRect();
    setChoice(CHOICES[target].value, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        'border-line bg-panel/75 shadow-float inline-flex items-center gap-1 rounded-full border p-1 backdrop-blur-md backdrop-saturate-150',
        position === 'fixed' && 'fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6',
        className,
      )}
    >
      {CHOICES.map((item, index) => {
        const active = item.value === choice;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            tabIndex={active ? 0 : -1}
            role="radio"
            aria-checked={active}
            aria-label={item.label}
            title={item.label}
            onClick={(event) => pick(item.value, event)}
            onKeyDown={(event) => move(event, index)}
            className={cx(
              'flex size-9 cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              active ? 'bg-primary text-primary-contrast shadow-card' : 'text-muted-color hover:bg-sunken hover:text-color',
            )}
          >
            <i
              key={active ? `${item.value}-on` : item.value}
              className={cx(`icon icon-${item.icon} text-[0.95rem]`, active && 'animate-icon-turn')}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
