import { useState } from 'react';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const HUES = ['#2f73e0', '#0d9488', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0284c7', '#b45309', '#4f46e5', '#be123c'];
const SIZE = {
  xs: 'size-6 text-[0.6rem]',
  sm: 'size-7 text-[0.65rem]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-14 text-lg',
};
const DOT = { xs: 'size-2', sm: 'size-2', md: 'size-2.5', lg: 'size-3', xl: 'size-3.5' };
const PRESENCE = {
  online: { className: 'bg-success', label: 'online' },
  away: { className: 'bg-warn', label: 'away' },
  busy: { className: 'bg-danger', label: 'busy' },
  offline: { className: 'bg-field-line', label: 'offline' },
};
function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 31 + (char.codePointAt(0) ?? 0)) | 0;
  return Math.abs(value);
}
export function initials(name) {
  const words = name
    .trim()
    .split(/[\s._@-]+/)
    .filter(Boolean);
  const first = words[0]?.charAt(0) ?? '?';
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}
export function tintFor(name) {
  const hue = HUES[hash(name.trim().toLowerCase()) % HUES.length];
  return {
    backgroundColor: `color-mix(in srgb, ${hue} 16%, var(--color-panel))`,
    color: `color-mix(in srgb, ${hue} 72%, var(--color-ink-emphasis))`,
  };
}
export function Avatar({ name, src, size = 'md', shape = 'circle', presence, decorative = false, className }) {
  const [failed, setFailed] = useState(null);
  const showImage = src != null && src !== '' && failed !== src;
  const label = presence === undefined ? name : `${name} (${PRESENCE[presence].label})`;
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      title={decorative ? undefined : label}
      className={cx('relative inline-flex shrink-0 select-none', SIZE[size], className)}
    >
      <span
        style={showImage ? undefined : tintFor(name)}
        className={cx(
          'flex size-full items-center justify-center overflow-hidden leading-none font-semibold tracking-wide',
          shape === 'circle' ? 'rounded-full' : 'rounded-[28%]',
        )}
      >
        {showImage ? (
          <img src={src} alt="" draggable={false} onError={() => setFailed(src)} className="size-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      {presence !== undefined && (
        <span
          aria-hidden
          className={cx('ring-panel absolute right-0 bottom-0 rounded-full ring-2', DOT[size], PRESENCE[presence].className)}
        />
      )}
    </span>
  );
}
export function AvatarGroup({ people, max = 4, size = 'sm', label, className }) {
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.slice(shown.length);
  return (
    <div
      role="group"
      aria-label={label ?? `${people.length} ${people.length === 1 ? 'person' : 'people'}`}
      className={cx('flex items-center -space-x-2', className)}
    >
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          src={person.src}
          size={size}
          className="ring-panel rounded-full ring-2 transition-transform duration-200 ease-[var(--ease-out-quint)] hover:z-10 hover:-translate-y-0.5"
        />
      ))}
      {rest.length > 0 && (
        <span
          title={rest.map((person) => person.name).join(', ')}
          className={cx(
            'bg-sunken text-muted-color ring-panel relative inline-flex items-center justify-center rounded-full font-semibold ring-2',
            SIZE[size],
          )}
        >
          <span aria-hidden>+{rest.length}</span>
          <span className="sr-only">and {rest.map((person) => person.name).join(', ')}</span>
        </span>
      )}
    </div>
  );
}
