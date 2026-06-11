import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import { getSavedCartId, mergeGuestCartWithUser } from '../services/cartService';

const resolveSafeNextPath = (
  rawNext: string | null,
  role: 'customer' | 'product_manager' | 'admin',
): string => {
  if (!rawNext || !rawNext.startsWith('/')) return '/';

  const isAdminArea = rawNext.startsWith('/admin');
  if (!isAdminArea) return rawNext;

  if (rawNext.startsWith('/admin/users')) {
    return role === 'admin' ? rawNext : '/';
  }

  if (rawNext.startsWith('/admin/orders') || rawNext.startsWith('/admin/reviews')) {
    return role === 'admin' || role === 'product_manager' ? rawNext : '/';
  }

  return '/';
};

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = new URLSearchParams(location.search).get('next') ?? '/';

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login({ email, password });
      signIn(response.accessToken, response.user);
      try {
        await mergeGuestCartWithUser(response.accessToken, getSavedCartId());
      } catch {
        // Non-fatal: user still logged in even if cart merge fails.
      }
      navigate(resolveSafeNextPath(next, response.user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <h2 className="mb-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-box-arrow-in-right text-primary" aria-hidden />
          Login
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-circle-fill" aria-hidden />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">
              Email
            </label>
            <input
              id="loginEmail"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label">
              Password
            </label>
            <div className="input-group">
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden />
                Logging in…
              </>
            ) : (
              <>
                <i className="bi bi-unlock-fill" aria-hidden />
                Login
              </>
            )}
          </button>
        </form>
        <p className="mt-3 mb-0">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};
