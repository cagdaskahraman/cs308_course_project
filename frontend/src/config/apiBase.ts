/**
 * Nest API origin. `??` alone does not treat "" as missing; a blank env would make
 * fetch("/admin/users") hit the Vite dev server and return "Cannot GET /admin/users".
 */
export const API_BASE_URL: string = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const trimmed = raw?.trim();
  if (trimmed) return trimmed.replace(/\/$/, '');
  return 'http://localhost:3000';
})();
