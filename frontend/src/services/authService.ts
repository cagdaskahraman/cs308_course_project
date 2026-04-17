const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3000';

export type AuthUser = {
  id: string;
  email: string;
  role: 'customer' | 'product_manager';
};

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let errorMessage = `Request failed with status ${response.status}`;
  try {
    const errorBody = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(errorBody.message)) {
      errorMessage = errorBody.message.join(', ');
    } else if (typeof errorBody.message === 'string') {
      errorMessage = errorBody.message;
    }
  } catch {
    // Ignore body parse failure and keep fallback message.
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await postJson('/auth/register', payload);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginResponse>('/auth/login', payload);
}
