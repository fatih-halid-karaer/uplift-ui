"""Check WCAG 2 contrast of the semantic token pairs in every palette, theme and tone.

Usage:
  python contrast_check.py [--tokens ../assets/tokens.plain.css] [--themes ../assets/themes]
                           [--palette ocean --palette sunset ...] [--flavour soft]
                           [--extra ./src/my-palette.css] [--all] [--json]

Reads the plain-CSS token file and the palette presets, resolves var(), color-mix(in srgb|oklab, ...),
hex and rgb() values for light, dark and dim, and measures each pair the components rely on:
body and muted text on canvas and panel, primary text and buttons, highlighted rows, and the
status inks on the panel and on their soft fills. Translucent fills are composited over the
panel first, as the browser would.

Text pairs need 4.5:1 (WCAG 1.4.3 AA); the focus ring needs 3:1 against the canvas (1.4.11).
Field borders are listed for information only: 1.4.11 asks 3:1 for the boundary that identifies
a control, which a filled or shadowed field can satisfy without a dark border.

Prints failing pairs only unless --all is given. Exit code 1 when any required pair fails, so
it can run in CI after a palette is edited. --extra adds a project's own palette file, which is
read after the presets, so a custom `:root[data-palette='brand']` block can be checked too.
"""

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TOKENS = os.path.join(HERE, '..', 'assets', 'tokens.plain.css')
DEFAULT_THEMES = os.path.join(HERE, '..', 'assets', 'themes')

STATUSES = ('success', 'warn', 'danger', 'info')

PAIRS = [
    ('ink', 'canvas', 4.5, 'body text on the page'),
    ('ink', 'panel', 4.5, 'body text on cards'),
    ('ink-emphasis', 'panel', 4.5, 'headings on cards'),
    ('ink-muted', 'panel', 4.5, 'secondary text on cards'),
    ('ink-muted', 'canvas', 4.5, 'secondary text on the page'),
    ('ink-muted', 'subtle', 4.5, 'secondary text on table heads and toolbars'),
    ('primary', 'panel', 4.5, 'links and primary text'),
    ('primary-contrast', 'primary', 4.5, 'primary button label'),
    ('highlight-ink', 'highlight', 4.5, 'selected row and active nav text'),
    ('primary', 'canvas', 3.0, 'focus ring against the page'),
    ('field-line', 'field', 0.0, 'field border (information only)'),
]
for status in STATUSES:
    PAIRS.append((status + '-ink', 'panel', 4.5, status + ' status text'))
    PAIRS.append((status + '-ink', status + '-soft', 4.5, status + ' text on its soft fill'))

RULE = re.compile(r'([^{}]+)\{([^{}]*)\}')
DECL = re.compile(r'(--[\w-]+)\s*:\s*([^;]+);')
ATTR = re.compile(r"(:not\()?\[data-(palette|theme|tone|flavour)=['\"]?([\w-]+)['\"]?\]\)?")


def strip_comments(text):
    return re.sub(r'/\*.*?\*/', '', text, flags=re.S)


def rules(path):
    with open(path, encoding='utf-8') as handle:
        text = strip_comments(handle.read())
    text = re.sub(r'@media[^{]*\{', '', text)
    for selector, body in RULE.findall(text):
        declarations = DECL.findall(body)
        if not declarations:
            continue
        for part in selector.split(','):
            part = part.strip()
            if part.startswith(':root') and ' ' not in part:
                yield part, declarations


def applies(selector, mode):
    for negated, key, value in ATTR.findall(selector):
        holds = mode.get(key) == value
        if holds == bool(negated):
            return False
    return True


def variables(files, mode):
    found = {}
    for path in files:
        for selector, declarations in rules(path):
            if applies(selector, mode):
                for name, value in declarations:
                    found[name[2:]] = value.strip()
    return found


def split_args(text):
    parts, depth, current = [], 0, ''
    for char in text:
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
        if char == ',' and depth == 0:
            parts.append(current.strip())
            current = ''
        else:
            current += char
    parts.append(current.strip())
    return parts


def resolve(value, names, seen=()):
    value = value.strip()
    match = re.fullmatch(r'var\(\s*--([\w-]+)\s*(?:,(.*))?\)', value, flags=re.S)
    if match:
        name, fallback = match.group(1), match.group(2)
        if name in names and name not in seen:
            return resolve(names[name], names, seen + (name,))
        if fallback is not None:
            return resolve(fallback, names, seen)
        raise ValueError('undefined --' + name)
    if value.startswith('color-mix('):
        args = split_args(value[len('color-mix('):-1])
        space = args[0].replace(' ', '') if args else ''
        if space not in ('insrgb', 'inoklab'):
            raise ValueError('only color-mix(in srgb|oklab, ...) is supported: ' + value)
        return mix(args[1], args[2], names, seen, space == 'inoklab')
    return parse_colour(value, names, seen)


def parse_colour(value, names, seen):
    value = value.strip().lower()
    if value == 'transparent':
        return (0.0, 0.0, 0.0, 0.0)
    if value in ('white', '#fff'):
        return (1.0, 1.0, 1.0, 1.0)
    if value == 'black':
        return (0.0, 0.0, 0.0, 1.0)
    if value.startswith('var(') or value.startswith('color-mix('):
        return resolve(value, names, seen)
    if value.startswith('#'):
        digits = value[1:]
        if len(digits) in (3, 4):
            digits = ''.join(c * 2 for c in digits)
        channels = [int(digits[i:i + 2], 16) / 255 for i in range(0, len(digits), 2)]
        return tuple(channels[:3]) + ((channels[3],) if len(channels) == 4 else (1.0,))
    match = re.fullmatch(r'rgba?\((.*)\)', value)
    if match:
        body = match.group(1).replace(',', ' ').replace('/', ' / ')
        parts = body.split()
        alpha = 1.0
        if '/' in parts:
            alpha_text = parts[parts.index('/') + 1]
            alpha = float(alpha_text[:-1]) / 100 if alpha_text.endswith('%') else float(alpha_text)
            parts = parts[:parts.index('/')]
        elif len(parts) == 4:
            alpha = float(parts[3])
            parts = parts[:3]
        rgb = [float(p[:-1]) / 100 if p.endswith('%') else float(p) / 255 for p in parts]
        return tuple(rgb) + (alpha,)
    raise ValueError('unsupported colour: ' + value)


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def to_srgb(c):
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def oklab(colour):
    r, g, b = (to_linear(c) for c in colour[:3])
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def from_oklab(lab):
    L, a, b = lab
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (to_srgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            to_srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            to_srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))


def mix(first, second, names, seen, perceptual=False):
    def colour_and_share(arg):
        match = re.fullmatch(r'(.*?)\s+(\d+(?:\.\d+)?)%', arg.strip(), flags=re.S)
        if match and not match.group(1).rstrip().endswith(','):
            return parse_colour(match.group(1), names, seen), float(match.group(2)) / 100
        return parse_colour(arg, names, seen), None

    a, pa = colour_and_share(first)
    b, pb = colour_and_share(second)
    if pa is None and pb is None:
        pa = pb = 0.5
    elif pa is None:
        pa = 1 - pb
    elif pb is None:
        pb = 1 - pa
    total = pa + pb
    pa, pb = pa / total, pb / total
    alpha = a[3] * pa + b[3] * pb
    if alpha == 0:
        return (0.0, 0.0, 0.0, 0.0)
    if perceptual:
        la, lb = oklab(a), oklab(b)
        lab = tuple((la[i] * a[3] * pa + lb[i] * b[3] * pb) / alpha for i in range(3))
        return from_oklab(lab) + (alpha,)
    rgb = tuple((a[i] * a[3] * pa + b[i] * b[3] * pb) / alpha for i in range(3))
    return rgb + (alpha,)


def over(top, bottom):
    alpha = top[3] + bottom[3] * (1 - top[3])
    if alpha == 0:
        return (0.0, 0.0, 0.0, 0.0)
    rgb = tuple((top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha for i in range(3))
    return rgb + (alpha,)


def luminance(colour):
    def channel(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in colour[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(fg, bg):
    hi, lo = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def hex_of(colour):
    return '#' + ''.join('%02x' % round(max(0, min(1, c)) * 255) for c in colour[:3])


def check(files, mode):
    names = variables(files, mode)
    results = []
    white = (1.0, 1.0, 1.0, 1.0)
    try:
        canvas = over(resolve('var(--canvas)', names), white)
        panel = over(resolve('var(--panel)', names), canvas)
    except ValueError as error:
        return [{'error': str(error)}]
    for fg_name, bg_name, needed, label in PAIRS:
        try:
            base = canvas if bg_name == 'canvas' else panel
            bg = base if bg_name in ('canvas', 'panel') else over(resolve('var(--' + bg_name + ')', names), base)
            fg = over(resolve('var(--' + fg_name + ')', names), bg)
        except ValueError as error:
            results.append({'pair': fg_name + ' on ' + bg_name, 'label': label, 'error': str(error)})
            continue
        value = ratio(fg, bg)
        results.append({
            'pair': fg_name + ' on ' + bg_name,
            'label': label,
            'ratio': round(value, 2),
            'needed': needed,
            'fg': hex_of(fg),
            'bg': hex_of(bg),
            'ok': needed == 0 or value >= needed,
            'info': needed == 0,
        })
    return results


def palettes_in(folder):
    found = []
    for name in sorted(os.listdir(folder)):
        if name.endswith('.css') and not name.startswith(('flavour-', 'hooks')):
            found.append(name[:-4])
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--tokens', default=DEFAULT_TOKENS)
    parser.add_argument('--themes', default=DEFAULT_THEMES)
    parser.add_argument('--palette', action='append', default=[], help='palette name; repeat; default: every preset plus the base tokens')
    parser.add_argument('--flavour', help='also apply flavour-NAME.css from the themes folder')
    parser.add_argument('--extra', action='append', default=[], help="a project CSS file with its own :root[data-palette='...'] block")
    parser.add_argument('--all', action='store_true', help='print passing pairs too')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    theme_files = [os.path.join(args.themes, name) for name in sorted(os.listdir(args.themes))
                   if name.endswith('.css') and not name.startswith(('flavour-', 'hooks'))]
    if args.flavour:
        theme_files.append(os.path.join(args.themes, 'flavour-' + args.flavour + '.css'))
    files = [args.tokens] + theme_files + args.extra

    palettes = args.palette or ([None] + palettes_in(args.themes))
    report, failures = [], 0
    for palette in palettes:
        for theme, tone in (('light', None), ('dark', None), ('dark', 'dim')):
            mode = {'theme': theme}
            if palette:
                mode['palette'] = palette
            if tone:
                mode['tone'] = tone
            if args.flavour:
                mode['flavour'] = args.flavour
            results = check(files, mode)
            failed = [r for r in results if 'error' in r or not r.get('ok', True)]
            failures += len(failed)
            report.append({'palette': palette or 'base', 'theme': theme if not tone else 'dim', 'results': results})

    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
        return 1 if failures else 0

    for block in report:
        shown = [r for r in block['results'] if args.all or 'error' in r or not r['ok']]
        if not shown:
            continue
        print('%s / %s' % (block['palette'], block['theme']))
        for r in shown:
            if 'error' in r:
                print('  ERROR %-34s %s' % (r.get('pair', ''), r['error']))
                continue
            mark = 'info' if r['info'] else ('ok  ' if r['ok'] else 'FAIL')
            need = '' if r['info'] else ' (needs %.1f)' % r['needed']
            print('  %s %-34s %5.2f%s  %s on %s  %s' % (mark, r['pair'], r['ratio'], need, r['fg'], r['bg'], r['label']))
    checked = sum(1 for block in report for r in block['results'] if not r.get('info'))
    print('\n%d pairs checked across %d palette/theme combinations, %d failing.' % (checked, len(report), failures))
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
