import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import { getSavedCartId, mergeGuestCartWithUser } from '../services/cartService';

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // non-fatal
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="es-auth">
      <aside className="es-auth__side">
        <div className="es-auth__side-brand">
          <span className="es-brand__mark">E</span>
          ElectroStore
        </div>
        <p className="es-auth__quote">
          Welcome back — your <em>curated</em> tech collection is just a moment away.
        </p>
        <div className="es-auth__side-foot">
          Secure sign-in · Encrypted &amp; private · © ElectroStore {new Date().getFullYear()}
        </div>
      </aside>

      <section className="es-auth__form-wrap">
        <div className="es-auth__form fade-up">
          <span className="eyebrow">Account</span>
          <h1 className="es-auth__title">Sign in</h1>
          <p className="es-auth__sub">Pick up where you left off. Your cart and order history will be waiting.</p>

          {error && (
            <div className="es-alert es-alert--danger" style={{ marginBottom: '1rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="es-auth__fields" noValidate>
            <div className="es-field">
              <label htmlFor="loginEmail" className="es-label">Email</label>
              <input
                id="loginEmail"
                type="email"
                className="es-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="es-field">
              <label htmlFor="loginPassword" className="es-label">Password</label>
              <input
                id="loginPassword"
                type="password"
                className="es-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="es-btn es-btn--primary es-btn--lg es-btn--block" type="submit" disabled={loading} style={{ marginTop: '.25rem' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="es-auth__meta-link">
            New to ElectroStore? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
};
