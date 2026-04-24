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

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <h2 className="mb-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-person-plus-fill text-primary" aria-hidden />
          Register
        </h2>
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
            <label htmlFor="registerPassword" className="form-label">
              Password
            </label>
            <input
              id="registerPassword"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="registerConfirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="registerConfirmPassword"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
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
        <p className="mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};
