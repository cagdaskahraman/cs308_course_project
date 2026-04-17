export function displayProductMeta(value: string | null | undefined): string {
  if (value == null) return '—';
  const t = String(value).trim();
  return t.length > 0 ? t : '—';
}
