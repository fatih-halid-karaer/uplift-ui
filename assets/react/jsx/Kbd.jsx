const cx = (...parts) => parts.filter(Boolean).join(' ');
const NAMES = {
  mod: { mac: '⌘', other: 'Ctrl', spoken: 'Command or Control' },
  cmd: { mac: '⌘', other: 'Win', spoken: 'Command' },
  ctrl: { mac: '⌃', other: 'Ctrl', spoken: 'Control' },
  alt: { mac: '⌥', other: 'Alt', spoken: 'Alt' },
  shift: { mac: '⇧', other: 'Shift', spoken: 'Shift' },
  enter: { mac: '↵', other: 'Enter', spoken: 'Enter' },
  esc: { mac: 'Esc', other: 'Esc', spoken: 'Escape' },
  tab: { mac: '⇥', other: 'Tab', spoken: 'Tab' },
  backspace: { mac: '⌫', other: '⌫', spoken: 'Backspace' },
  delete: { mac: '⌦', other: 'Del', spoken: 'Delete' },
  space: { mac: 'Space', other: 'Space', spoken: 'Space' },
  up: { mac: '↑', other: '↑', spoken: 'Up arrow' },
  down: { mac: '↓', other: '↓', spoken: 'Down arrow' },
  left: { mac: '←', other: '←', spoken: 'Left arrow' },
  right: { mac: '→', other: '→', spoken: 'Right arrow' },
};
export const isApple = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgentData?.platform ?? navigator.userAgent);
export function Kbd({ keys, size = 'sm', className }) {
  const apple = isApple();
  const list = typeof keys === 'string' ? keys.split('+').map((key) => key.trim()) : keys;
  const spoken = list.map((key) => NAMES[key.toLowerCase()]?.spoken ?? key).join(' plus ');
  return (
    <span className={cx('inline-flex items-center gap-0.5 align-middle', className)}>
      <span className="sr-only">{spoken}</span>
      {list.map((key, index) => {
        const known = NAMES[key.toLowerCase()];
        return (
          <kbd
            key={`${key}-${index}`}
            aria-hidden
            className={cx(
              'border-line bg-panel text-muted-color inline-flex items-center justify-center rounded-[5px] border border-b-2 font-sans leading-none font-medium',
              size === 'sm' ? 'h-5 min-w-5 px-1 text-[0.6875rem]' : 'h-6 min-w-6 px-1.5 text-xs',
            )}
          >
            {known === undefined ? key.toUpperCase() : apple ? known.mac : known.other}
          </kbd>
        );
      })}
    </span>
  );
}
