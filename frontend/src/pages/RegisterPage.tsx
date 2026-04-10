import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = (): JSX.Element => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-12 col-sm-8 col-md-5 col-lg-4">
        <h2 className="fw-bold mb-4 text-center">Register</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="mb-3">
            <label htmlFor="regEmail" className="form-label">Email</label>
            <input
              id="regEmail"
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="regPassword" className="form-label">Password</label>
            <input
              id="regPassword"
              type="password"
              className="form-control"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="regConfirm" className="form-label">Confirm Password</label>
            <input
              id="regConfirm"
              type="password"
              className="form-control"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-3 text-secondary">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
};
