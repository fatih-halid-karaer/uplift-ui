"""Scan a frontend for the defects in references/audit-checklist.md that can be found statically.

Usage:
  python audit_scan.py --src ./src [--src ./public] [--exclude legacy] [--examples 5]
                       [--json] [--fail-on high]

Walks .css/.scss/.sass/.less/.html/.js/.jsx/.ts/.tsx/.vue/.svelte files (skipping node_modules,
dist, build, coverage, .git and minified files) and reports, grouped like the checklist:

  structure   hard-coded colours outside token files, several :root token layers, ad-hoc
              breakpoints, too many z-index and font-size values, wide fixed widths,
              platform-only fonts first in a font stack, !important and inline styles
  theme       dark mode without a pre-paint theme script, color-scheme fixed in index.html
  feedback    window.alert/confirm/prompt, more than one toast or snackbar library
  data        user-select: none on the page
  a11y        icon-only buttons without a label, images without alt, focus outlines removed
              without a :focus-visible replacement, positive tabindex, click handlers on
              div/span without a role, animation without a prefers-reduced-motion fallback

Each finding has a severity (high, medium, low) and up to --examples file:line locations.
The scan is a starting point for the audit, not a verdict: read the flagged lines before
planning a fix, and walk the pages for everything a scan cannot see (layout, copy, flows).
--fail-on makes the exit code 1 when a finding of that severity or worse exists, for CI.
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict

STYLE_EXT = ('.css', '.scss', '.sass', '.less')
MARKUP_EXT = ('.html', '.vue', '.svelte')
SCRIPT_EXT = ('.js', '.jsx', '.ts', '.tsx', '.mjs')
SKIP_DIRS = {'node_modules', 'dist', 'build', 'coverage', '.git', '.next', '.nuxt', '.angular', 'out', 'vendor', '.svelte-kit'}
SEVERITY = {'high': 3, 'medium': 2, 'low': 1}
SECTIONS = ('structure', 'theme', 'feedback', 'data', 'a11y')
STANDARD_BREAKPOINTS = {640, 768, 1024, 1280, 1536}
PLATFORM_FONTS = ('segoe ui', 'tahoma', 'calibri', 'verdana', 'arial', 'helvetica', 'helvetica neue',
                  'roboto', '-apple-system', 'blinkmacsystemfont', 'san francisco', 'trebuchet ms')
TOAST_LIBRARIES = {
    'react-hot-toast': r"from\s+['\"]react-hot-toast['\"]",
    'react-toastify': r"from\s+['\"]react-toastify['\"]",
    'sonner': r"from\s+['\"]sonner['\"]",
    'notistack': r"from\s+['\"]notistack['\"]",
    'sweetalert2': r"from\s+['\"]sweetalert2['\"]",
    'ngx-toastr': r"from\s+['\"]ngx-toastr['\"]",
    'Angular MatSnackBar': r"\bMatSnackBar\b",
    'antd message/notification': r"\b(?:message|notification)\.(?:success|error|info|warning|open)\(",
    'vue-toastification': r"from\s+['\"]vue-toastification['\"]",
    'PrimeNG/PrimeVue MessageService': r"\bMessageService\b",
}

HEX = re.compile(r'(?<![\w&-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')
FUNC_COLOUR = re.compile(r'\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]')
CUSTOM_PROP = re.compile(r'^\s*--[\w-]+\s*:')
ROOT_TOKENS = re.compile(r'(?::root|html)\b[^{]*\{[^}]*--[\w-]+\s*:', re.S)
MEDIA_WIDTH = re.compile(r'@media[^{]*?\((?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)px', re.I)
Z_INDEX = re.compile(r'z-index\s*:\s*(-?\d+)', re.I)
FONT_SIZE_PX = re.compile(r'font-size\s*:\s*(\d+(?:\.\d+)?)px', re.I)
WIDE_FIXED = re.compile(r'(?<![-\w])(?:min-)?width\s*:\s*(\d{3,4})px', re.I)
FONT_FAMILY = re.compile(r'font-family\s*:\s*([^;}{]+)', re.I)
IMPORTANT = re.compile(r'!important')
INLINE_STYLE = re.compile(r'\sstyle\s*=\s*["\'{]')
DIALOGS = re.compile(r'(?<![\w.])(?:window\.)?(alert|confirm|prompt)\s*\(\s*[`\'"\w]')
OUTLINE_NONE = re.compile(r'outline\s*:\s*(?:none|0)\b', re.I)
FOCUS_VISIBLE = re.compile(r':focus-visible')
USER_SELECT_PAGE = re.compile(r'(?:^|\})\s*(?:html|body|\*|:root)\s*\{[^}]*user-select\s*:\s*none', re.I | re.M)
ANIMATION = re.compile(r'@keyframes|\btransition\s*:|\banimation\s*:', re.I)
REDUCED_MOTION = re.compile(r'prefers-reduced-motion')
BUTTON = re.compile(r'<button\b([^>]*)>(.*?)</button>', re.S | re.I)
ICON_TAG = re.compile(r'<(?:i|svg|mat-icon|ion-icon|fa-icon|span)\b[^>]*>.*?</(?:i|svg|mat-icon|ion-icon|fa-icon|span)>'
                      r'|<(?:[A-Z]\w*Icon|Icon|[A-Z]\w*|i|img)\b[^>]*/>', re.S)
IMG_TAG = re.compile(r'<img\b([^>]*)>', re.I)
POSITIVE_TABINDEX = re.compile(r'tab[iI]ndex\s*=\s*["{]?\s*["\']?([1-9]\d*)')
CLICK_ON_DIV = re.compile(r'<(div|span|li|td)\b([^>]*?\s(?:onClick|\(click\)|@click|v-on:click|on:click)\s*=[^>]*)>', re.S)
DARK_MARKERS = re.compile(r"data-theme\s*=\s*['\"]?dark|\[data-theme=['\"]?dark|prefers-color-scheme\s*:\s*dark"
                          r"|\.dark\s*[{.,:\s]|dark-theme|theme-dark|darkMode", re.I)
PREPAINT = re.compile(r'<script(?![^>]*\bsrc=)[^>]*>(?:(?!</script>).)*(?:data-theme|classList|colorScheme|color-scheme|localStorage)(?:(?!</script>).)*</script>', re.S | re.I)
META_SCHEME = re.compile(r'<meta[^>]+name=["\']color-scheme["\'][^>]+content=["\'](light|dark)["\']', re.I)


class Findings:
    def __init__(self, examples):
        self.examples = examples
        self.items = {}

    def add(self, key, section, severity, title, fix, path=None, line=None, count=1):
        item = self.items.setdefault(key, {
            'section': section, 'severity': severity, 'title': title, 'fix': fix, 'count': 0, 'where': [],
        })
        item['count'] += count
        if path is not None and len(item['where']) < self.examples:
            item['where'].append('%s:%s' % (path, line) if line else path)

    def ranked(self):
        return sorted(self.items.values(), key=lambda i: (SECTIONS.index(i['section']), -SEVERITY[i['severity']], -i['count']))


def files_under(roots, excludes):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for folder, dirs, names in os.walk(root):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not any(x in os.path.join(folder, d) for x in excludes)]
            for name in names:
                if name.endswith(STYLE_EXT + MARKUP_EXT + SCRIPT_EXT) and '.min.' not in name:
                    path = os.path.join(folder, name)
                    if not any(x in path for x in excludes):
                        yield path


def line_of(text, index):
    return text.count('\n', 0, index) + 1


def is_token_file(path, text):
    name = os.path.basename(path).lower()
    if any(word in name for word in ('token', 'theme', 'variables', 'palette', 'colors', 'colours')):
        return True
    lines = [l for l in text.splitlines() if l.strip()]
    return bool(lines) and sum(1 for l in lines if CUSTOM_PROP.match(l)) / len(lines) > 0.5


def strip_comments(text, path):
    if path.endswith(STYLE_EXT):
        text = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), text, flags=re.S)
        if path.endswith(('.scss', '.sass', '.less')):
            text = re.sub(r'(?m)(^|\s)//.*$', r'\1', text)
    elif path.endswith(MARKUP_EXT):
        text = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), text, flags=re.S)
    return text


def style_regions(path, text):
    if path.endswith(STYLE_EXT):
        return [(0, text)]
    regions = [(m.start(1), m.group(1)) for m in re.finditer(r'<style\b[^>]*>(.*?)</style>', text, re.S | re.I)]
    if path.endswith(SCRIPT_EXT):
        regions += [(m.start(1), m.group(1)) for m in re.finditer(r'(?:css|styled\.\w+|createGlobalStyle|keyframes)`(.*?)`', text, re.S)]
    return regions


def scan(roots, excludes, examples):
    found = Findings(examples)
    breakpoints = defaultdict(list)
    z_values = defaultdict(list)
    font_sizes = defaultdict(list)
    token_roots = []
    toasts = defaultdict(list)
    dark_mode_seen = None
    animation_seen = None
    reduced_motion_seen = False
    index_html = []

    for path in files_under(roots, excludes):
        try:
            with open(path, encoding='utf-8', errors='ignore') as handle:
                raw = handle.read()
        except OSError:
            continue
        text = strip_comments(raw, path)
        rel = os.path.relpath(path)
        token_file = path.endswith(STYLE_EXT) and is_token_file(path, text)

        if os.path.basename(path).lower() == 'index.html':
            index_html.append((rel, text))
        elif dark_mode_seen is None and DARK_MARKERS.search(text):
            dark_mode_seen = rel
        if REDUCED_MOTION.search(text):
            reduced_motion_seen = True

        for offset, css in style_regions(path, text):
            if ROOT_TOKENS.search(css):
                token_roots.append(rel)
            for m in MEDIA_WIDTH.finditer(css):
                breakpoints[int(float(m.group(1)))].append('%s:%d' % (rel, line_of(text, offset + m.start())))
            for m in Z_INDEX.finditer(css):
                z_values[int(m.group(1))].append('%s:%d' % (rel, line_of(text, offset + m.start())))
            for m in FONT_SIZE_PX.finditer(css):
                font_sizes[m.group(1)].append('%s:%d' % (rel, line_of(text, offset + m.start())))
            for m in WIDE_FIXED.finditer(css):
                if int(m.group(1)) >= 480:
                    found.add('wide-fixed', 'structure', 'medium', 'Fixed widths of 480px or more',
                              'use max-width, minmax() or a percentage so phones (360px) do not scroll sideways',
                              rel, line_of(text, offset + m.start()))
            for m in FONT_FAMILY.finditer(css):
                first = m.group(1).split(',')[0].strip().strip('\'"').lower()
                if first in PLATFORM_FONTS and 'var(' not in m.group(1):
                    found.add('platform-font', 'structure', 'low', 'Platform font first in a font stack',
                              'self-host the brand font and keep platform fonts as fallbacks (identity.md)',
                              rel, line_of(text, offset + m.start()))
            if animation_seen is None and ANIMATION.search(css):
                animation_seen = rel
            for m in OUTLINE_NONE.finditer(css):
                if not FOCUS_VISIBLE.search(css):
                    found.add('outline-none', 'a11y', 'high', 'Focus outline removed with no :focus-visible replacement',
                              'keep a 2px :focus-visible outline in the primary colour (accessibility.md)',
                              rel, line_of(text, offset + m.start()))
            if USER_SELECT_PAGE.search(css):
                m = USER_SELECT_PAGE.search(css)
                found.add('user-select', 'data', 'medium', 'user-select: none on the whole page',
                          'limit it to buttons so people can copy data', rel, line_of(text, offset + m.start()))
            important = len(IMPORTANT.findall(css))
            if important:
                found.add('important', 'structure', 'low', '!important declarations',
                          'usually a sign of specificity fights between style layers; consolidate the layers',
                          rel, None, important)
            if not token_file:
                declared = {line_of(css, d.start()) for d in re.finditer(r'(?m)^\s*--[\w-]+\s*:', css)}
                for m in HEX.finditer(css):
                    if line_of(css, m.start()) in declared:
                        continue
                    found.add('hex', 'structure', 'medium', 'Hard-coded colours outside the token files',
                              'map each to a role token (tokens.md §10); literal colours also leak into dark mode',
                              rel, line_of(text, offset + m.start()))
                for m in FUNC_COLOUR.finditer(css):
                    if line_of(css, m.start()) in declared:
                        continue
                    found.add('hex', 'structure', 'medium', 'Hard-coded colours outside the token files',
                              'map each to a role token (tokens.md §10); literal colours also leak into dark mode',
                              rel, line_of(text, offset + m.start()))

        if path.endswith(SCRIPT_EXT + MARKUP_EXT):
            for m in DIALOGS.finditer(text):
                before = text[max(0, m.start() - 12):m.start()]
                if re.search(r'(?:function|def|\.\s*|:\s*)$', before):
                    continue
                found.add('native-dialog', 'feedback', 'high', 'window.%s()' % m.group(1) if m.group(1) != 'alert' else 'window.alert()',
                          'replace with the promise-based popup / confirm (feedback.md §1–2)',
                          rel, line_of(text, m.start()))
            for library, pattern in TOAST_LIBRARIES.items():
                if re.search(pattern, text):
                    toasts[library].append(rel)
            for m in BUTTON.finditer(text):
                attrs, inner = m.group(1), m.group(2)
                if re.search(r'aria-label|aria-labelledby|\[attr\.aria-label\]|:aria-label', attrs):
                    continue
                visible = ICON_TAG.sub('', inner)
                visible = re.sub(r'<[^>]+>', '', visible)
                visible = re.sub(r'\{[^}]*\}', 'x', visible) if path.endswith(('.jsx', '.tsx', '.vue', '.svelte')) else visible
                if not visible.strip() and ICON_TAG.search(inner):
                    found.add('icon-button', 'a11y', 'high', 'Icon-only buttons without an accessible name',
                              'add aria-label (and title) naming the action', rel, line_of(text, m.start()))
            for m in IMG_TAG.finditer(text):
                if not re.search(r'\balt\s*=|\[alt\]|:alt', m.group(1)):
                    found.add('img-alt', 'a11y', 'medium', 'Images without alt', 'add alt text, or alt="" for decoration',
                              rel, line_of(text, m.start()))
            for m in POSITIVE_TABINDEX.finditer(text):
                found.add('tabindex', 'a11y', 'medium', 'Positive tabindex', 'use 0 or -1 and fix the DOM order instead',
                          rel, line_of(text, m.start()))
            for m in CLICK_ON_DIV.finditer(text):
                if not re.search(r'\brole\s*=|aria-hidden\s*=\s*["{]?\s*["\']?true', m.group(2)):
                    found.add('click-div', 'a11y', 'medium', 'Click handlers on div/span/li/td without a role',
                              'use a button, or add role, tabindex and key handling', rel, line_of(text, m.start()))
            inline = len(INLINE_STYLE.findall(text))
            if inline >= 5:
                found.add('inline-style', 'structure', 'low', 'Files with many inline styles',
                          'move repeated inline styles into classes that read tokens', rel, None, inline)

    distinct_roots = sorted(set(token_roots))
    if len(distinct_roots) > 1:
        found.add('root-layers', 'structure', 'high', 'Token variables defined in %d files' % len(distinct_roots),
                  'one token file; components read role tokens only; delete dead skins', None, None, len(distinct_roots) - 1)
        found.items['root-layers']['where'] = distinct_roots[:examples]

    odd = sorted(bp for bp in breakpoints if not {bp - 1, bp, bp + 1} & STANDARD_BREAKPOINTS)
    if len(odd) >= 3:
        found.add('breakpoints', 'structure', 'medium', '%d ad-hoc breakpoints: %s' % (len(odd), ', '.join('%dpx' % b for b in odd[:12])),
                  'settle on 640, 768, 1024, 1280 (layout-responsive.md)', None, None, len(odd))
        found.items['breakpoints']['where'] = [breakpoints[b][0] for b in odd[:examples]]

    if len(z_values) > 8:
        found.add('z-index', 'structure', 'low', '%d different z-index values' % len(z_values),
                  'define a small z scale as tokens (dropdown, sticky, drawer, dialog, popup, tooltip)', None, None, len(z_values))
    if len(font_sizes) > 10:
        found.add('font-sizes', 'structure', 'low', '%d different px font sizes' % len(font_sizes),
                  'collapse onto the type scale in tokens.md', None, None, len(font_sizes))

    if len(toasts) > 1:
        found.add('toasts', 'feedback', 'high', 'Several message channels: %s' % ', '.join(sorted(toasts)),
                  'one popup channel for every message (feedback.md §1)', None, None, len(toasts))
        found.items['toasts']['where'] = [toasts[k][0] for k in sorted(toasts)][:examples]

    if dark_mode_seen and index_html:
        if not any(PREPAINT.search(text) for _, text in index_html):
            found.add('theme-flash', 'theme', 'high', 'Dark mode without a pre-paint theme script',
                      'inline script in index.html that sets data-theme and color-scheme before first paint (dark-mode.md)',
                      index_html[0][0])
        for rel, text in index_html:
            m = META_SCHEME.search(text)
            if m:
                found.add('meta-scheme', 'theme', 'medium', 'color-scheme fixed to %s in index.html' % m.group(1),
                          'set it from the stored theme in the pre-paint script', rel, line_of(text, m.start()))

    if animation_seen and not reduced_motion_seen:
        found.add('reduced-motion', 'a11y', 'high', 'Animations with no prefers-reduced-motion fallback',
                  'add the global reduced-motion block from tokens.plain.css', animation_seen)

    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--src', action='append', required=True, help='folder or file to scan; repeat for several')
    parser.add_argument('--exclude', action='append', default=[], help='skip paths containing this text; repeat')
    parser.add_argument('--examples', type=int, default=5)
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--fail-on', choices=['high', 'medium', 'low'])
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    findings = scan(args.src, args.exclude, args.examples).ranked()
    if args.json:
        json.dump(findings, sys.stdout, indent=2)
        print()
    else:
        print('# uplift-ui audit scan\n')
        if not findings:
            print('No static findings. Walk the pages for layout, copy and flow defects.')
        section = None
        for item in findings:
            if item['section'] != section:
                section = item['section']
                print('\n## %s\n' % section)
            print('- **[%s] %s** (%d)  \n  fix: %s' % (item['severity'], item['title'], item['count'], item['fix']))
            for where in item['where']:
                print('  - %s' % where)
        counts = defaultdict(int)
        for item in findings:
            counts[item['severity']] += 1
        print('\n%d high, %d medium, %d low. Static scan only: confirm each finding by reading the code, '
              'then walk the pages for what it cannot see.' % (counts['high'], counts['medium'], counts['low']))

    if args.fail_on:
        limit = SEVERITY[args.fail_on]
        return 1 if any(SEVERITY[i['severity']] >= limit for i in findings) else 0
    return 0


if __name__ == '__main__':
    sys.exit(main())
