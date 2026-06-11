import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../services/authService';

export const RegisterPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      await register({
        email,
        fullName,
        password,
        confirmPassword,
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__icon">
          <i className="bi bi-person-plus-fill" aria-hidden />
        </div>
        <h2 className="auth-card__title">Create your account</h2>
        <p className="auth-card__subtitle">Join ElectroStore to save your profile, track orders, and checkout securely.</p>
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-circle-fill" aria-hidden />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="mb-3">
            <label htmlFor="registerEmail" className="form-label">
              Email
            </label>
            <input
              id="registerEmail"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="registerFullName" className="form-label">
              Full name
            </label>
            <input
              id="registerFullName"
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="registerPassword" className="form-label">
              Password
            </label>
            <div className="input-group">
              <input
                id="registerPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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
          <div className="mb-3">
            <label htmlFor="registerConfirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="input-group">
              <input
                id="registerConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden />
                Registering…
              </>
            ) : (
              <>
                <i className="bi bi-person-check-fill" aria-hidden />
                Register
              </>
            )}
          </button>
        </form>
        <p className="mt-4 mb-0 text-center text-secondary">
          Already have an account? <Link to="/login" className="fw-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
