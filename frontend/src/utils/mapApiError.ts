export function mapApiError(status: number, fallback?: string): string {
  switch (status) {
    case 400: return fallback ?? 'Invalid request. Please check your input.';
    case 401: return 'Please log in to continue.';
    case 403: return 'You do not have permission for this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return fallback ?? 'Conflict - the resource may have already been modified.';
    case 500: return 'Internal server error. Please try again later.';
    default: return fallback ?? `Unexpected error (${status})`;
  }
}

export async function extractApiError(res: Response): Promise<string> {
  try {
    const body = await res.json() as Record<string, unknown>;
    const serverMsg = body.message ? String(body.message) : undefined;
    return mapApiError(res.status, serverMsg);
  } catch {
    return mapApiError(res.status);
  }
}
