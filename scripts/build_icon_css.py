"""Build mask-based icon CSS for only the icons a codebase uses.

Usage:
  python build_icon_css.py --src ./src --icons ./node_modules/lucide-static/icons --out ./src/icons.css
  [--prefix icon] [--stroke 1.75] [--alias old-name=lucide-name ...]

Scans .ts/.tsx/.js/.jsx/.vue/.svelte/.html files under --src for `<prefix>-NAME` classes and
`icon="NAME"` / `icon: 'NAME'` props, and writes one rule per icon found in --icons.
"""

import argparse
import os
import re
import sys
import urllib.parse

EXTENSIONS = ('.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html')


def used_names(src, prefix):
    pattern_class = re.compile(r'\b' + re.escape(prefix) + r'-([a-z0-9]+(?:-[a-z0-9]+)*)')
    pattern_prop = re.compile(r"\bicon\s*(?:=|:)\s*\{?\s*['\"]([a-z0-9-]+)['\"]")
    names = set()
    for folder, _, files in os.walk(src):
        if 'node_modules' in folder:
            continue
        for name in files:
            if not name.endswith(EXTENSIONS):
                continue
            with open(os.path.join(folder, name), encoding='utf-8', errors='ignore') as handle:
                text = handle.read()
            names.update(pattern_class.findall(text))
            names.update(pattern_prop.findall(text))
    return names


def data_uri(path, stroke):
    with open(path, encoding='utf-8') as handle:
        svg = handle.read()
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S)
    svg = re.sub(r'\s*class="[^"]*"', '', svg)
    svg = svg.replace('stroke-width="2"', f'stroke-width="{stroke}"').replace('stroke="currentColor"', 'stroke="black"')
    svg = re.sub(r'\s+', ' ', svg).replace('> <', '><').strip()
    return 'data:image/svg+xml,' + urllib.parse.quote(svg, safe=' =:/"<>-.,')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--src', required=True)
    parser.add_argument('--icons', required=True, help='folder of SVG files, e.g. lucide-static/icons')
    parser.add_argument('--out', required=True)
    parser.add_argument('--prefix', default='icon')
    parser.add_argument('--stroke', default='1.75')
    parser.add_argument('--alias', action='append', default=[], help='old=new, maps a name used in code to an SVG file name')
    args = parser.parse_args()

    aliases = dict(item.split('=', 1) for item in args.alias)
    found, missing = {}, []
    for name in sorted(used_names(args.src, args.prefix)):
        target = aliases.get(name, name)
        path = os.path.join(args.icons, target + '.svg')
        if os.path.exists(path):
            found[name] = path
        else:
            missing.append(name)

    lines = [
        '.' + args.prefix + ' {',
        '  display: inline-block;',
        '  width: 1em;',
        '  height: 1em;',
        '  flex-shrink: 0;',
        '  vertical-align: -0.125em;',
        '  background-color: currentColor;',
        '  mask: var(--icon, url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E")) center / contain no-repeat;',
        '}',
        '',
    ]
    for name, path in found.items():
        lines.append(f'.{args.prefix}-{name} {{')
        lines.append(f"  --icon: url('{data_uri(path, args.stroke)}');")
        lines.append('}')

    with open(args.out, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(lines) + '\n')

    print(f'{len(found)} icons written to {args.out}')
    if missing:
        print('not found (add --alias or ignore if they are not icons): ' + ', '.join(missing), file=sys.stderr)


if __name__ == '__main__':
    main()
