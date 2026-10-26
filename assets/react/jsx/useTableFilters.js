import { useMemo, useState } from 'react';
const asList = (value) => (typeof value === 'string' ? [value] : value);
export function useTableFilters(rows, columns) {
  const [search, setSearch] = useState('');
  const [texts, setTexts] = useState({});
  const [picks, setPicks] = useState({});
  const choices = useMemo(() => {
    const out = {};
    for (const column of columns) {
      if (column.kind !== 'choice') continue;
      const seen = new Set();
      for (const row of rows) for (const item of asList(column.value(row))) if (item !== '') seen.add(item);
      out[column.key] = [...seen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return out;
  }, [rows, columns]);
  const needle = search.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (needle !== '') {
      const hit = columns.some((column) => asList(column.value(row)).some((item) => item.toLowerCase().includes(needle)));
      if (!hit) return false;
    }
    for (const column of columns) {
      const values = asList(column.value(row));
      const text = texts[column.key]?.trim().toLowerCase() ?? '';
      if (text !== '' && !values.some((item) => item.toLowerCase().includes(text))) return false;
      const chosen = picks[column.key];
      if (chosen !== undefined && chosen.size > 0 && !values.some((item) => chosen.has(item))) return false;
    }
    return true;
  });
  const active =
    Object.values(texts).filter((text) => text.trim() !== '').length + Object.values(picks).filter((set) => set.size > 0).length;
  const filtering = needle !== '' || active > 0;
  const signature = JSON.stringify([needle, texts, Object.fromEntries(Object.entries(picks).map(([key, set]) => [key, [...set].sort()]))]);
  return {
    rows: filtered,
    total: rows.length,
    search,
    setSearch,
    texts,
    setText: (key, text) => setTexts((current) => ({ ...current, [key]: text })),
    picks,
    toggle: (key, item) =>
      setPicks((current) => {
        const next = new Set(current[key] ?? []);
        if (next.has(item)) next.delete(item);
        else next.add(item);
        return { ...current, [key]: next };
      }),
    choices,
    active,
    filtering,
    signature,
    clear: () => {
      setSearch('');
      setTexts({});
      setPicks({});
    },
  };
}
