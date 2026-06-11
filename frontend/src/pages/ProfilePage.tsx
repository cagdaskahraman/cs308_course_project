import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { getMyProfile, updateMyProfile } from '../services/userService';

export const ProfilePage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/profile', { replace: true });
      return;
    }
    void getMyProfile()
      .then((profile) => {
        setEmail(profile.email);
        setFullName(profile.fullName ?? '');
        setTaxId(profile.taxId ?? '');
        setHomeAddress(profile.homeAddress ?? '');
      })
      .catch((e) => {
        if (isAuthFailure(e)) {
          signOut();
          navigate('/login?next=/profile', { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Could not load profile');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, signOut]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateMyProfile({
        fullName: fullName.trim(),
        taxId: taxId.trim(),
        homeAddress: homeAddress.trim(),
      });
      showToast('Profile updated.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/profile', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading profile…" />;

  return (
    <>
      <PageHeader
        icon="bi-person-badge"
        title="My profile"
        subtitle="Keep your tax ID and home address up to date for checkout and invoices."
      />
      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      <form className="card data-card border-0" onSubmit={(e) => void handleSubmit(e)}>
        <div className="card-body row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="profileEmail">Email</label>
            <input id="profileEmail" className="form-control" value={email} readOnly />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="profileName">Full name</label>
            <input
              id="profileName"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="profileTaxId">Tax ID</label>
            <input
              id="profileTaxId"
              className="form-control"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="profileAddress">Home address</label>
            <textarea
              id="profileAddress"
              className="form-control"
              rows={3}
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            <Link to="/checkout" className="btn btn-outline-secondary">
              Go to checkout
            </Link>
          </div>
        </div>
      </form>
    </>
  );
};
