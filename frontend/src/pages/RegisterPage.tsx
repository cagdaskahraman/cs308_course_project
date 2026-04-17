import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../services/authService';

export const RegisterPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, confirmPassword });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : /[A-Z]/.test(password) && /\d/.test(password) ? 3
    : 2;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength];
  const strengthColor = ['var(--ink-200)', 'var(--danger)', 'var(--warn)', 'var(--success)'][strength];

  return (
    <div className="es-auth">
      <aside className="es-auth__side">
        <div className="es-auth__side-brand">
          <span className="es-brand__mark">E</span>
          ElectroStore
        </div>
        <p className="es-auth__quote">
          Join a community that values <em>craft, quality and taste</em> — free shipping and returns on every order.
        </p>
        <div className="es-auth__side-foot">
          By creating an account you agree to our terms &amp; privacy policy.
        </div>
      </aside>

      <section className="es-auth__form-wrap">
        <div className="es-auth__form fade-up">
          <span className="eyebrow">Get started</span>
          <h1 className="es-auth__title">Create your account</h1>
          <p className="es-auth__sub">Track orders, save favorites and checkout faster.</p>

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
              <label htmlFor="registerEmail" className="es-label">Email</label>
              <input
                id="registerEmail"
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
              <label htmlFor="registerPassword" className="es-label">Password</label>
              <input
                id="registerPassword"
                type="password"
                className="es-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              {password.length > 0 && (
                <div className="flex-row" style={{ gap: '.5rem', marginTop: '.35rem' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--ink-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(strength / 3) * 100}%`, height: '100%', background: strengthColor, transition: 'width .25s' }} />
                  </div>
                  <span style={{ fontSize: '.75rem', color: strengthColor, fontWeight: 600, minWidth: 44 }}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div className="es-field">
              <label htmlFor="registerConfirmPassword" className="es-label">Confirm password</label>
              <input
                id="registerConfirmPassword"
                type="password"
                className="es-input"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button className="es-btn es-btn--primary es-btn--lg es-btn--block" type="submit" disabled={loading} style={{ marginTop: '.25rem' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="es-auth__meta-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};
