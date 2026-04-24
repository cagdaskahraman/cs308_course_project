import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { isAuthFailure } from '../services/authService';
import {
  listAdminUsers,
  setUserRole,
  type AdminDirectoryUser,
} from '../services/adminUserService';

const roleLabel: Record<AdminDirectoryUser['role'], string> = {
  customer: 'Customer',
  product_manager: 'Product manager',
  admin: 'Administrator',
};

const roleBadgeClass: Record<AdminDirectoryUser['role'], string> = {
  customer: 'text-bg-secondary',
  product_manager: 'text-bg-info',
  admin: 'text-bg-danger',
};

export const AdminUsersPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [rows, setRows] = useState<AdminDirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(() => {
    return listAdminUsers()
      .then(setRows)
      .catch((e) => {
        if (isAuthFailure(e)) {
          signOut();
          navigate('/login?next=/admin/users', { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load users');
      });
  }, [navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/users', { replace: true });
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [isAdmin, isAuthenticated, load, navigate]);

  const applyRole = async (target: AdminDirectoryUser, role: AdminDirectoryUser['role']) => {
    if (
      !window.confirm(
        `Set ${target.email} to ${roleLabel[role]}?`,
      )
    ) {
      return;
    }
    setBusyId(target.id);
    setError('');
    try {
      const updated = await setUserRole(target.id, role);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/users', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-lock display-4 text-secondary mb-3 d-block" aria-hidden />
        <h4 className="fw-semibold">Please log in to access this page</h4>
        <Link to="/login?next=/admin/users" className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-box-arrow-in-right" aria-hidden />
          Log in
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-warning mt-5 d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden />
        <span>Only administrators can open the user management console.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading accounts…</p>
      </div>
    );
  }

  return (
    <>
      <AdminModerationNav active="users" />
      <h2 className="fw-bold mb-2 d-inline-flex align-items-center gap-2">
        <i className="bi bi-people-fill text-primary" aria-hidden />
        User management
      </h2>
      <p className="text-secondary mb-4">
        View every account, assign product manager or administrator, or return staff to the customer role.
        The last administrator in the system cannot be demoted.
      </p>
      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="table-responsive shadow-sm rounded border bg-white">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Joined</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="small text-break">{r.email}</td>
                <td>
                  <span className={`badge rounded-pill ${roleBadgeClass[r.role]}`}>
                    {roleLabel[r.role]}
                  </span>
                </td>
                <td className="text-muted small">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm" role="group" aria-label={`Role actions for ${r.email}`}>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={busyId === r.id || r.role === 'customer'}
                      onClick={() => void applyRole(r, 'customer')}
                      title="Customer"
                    >
                      <i className="bi bi-person" aria-hidden />
                      <span className="d-none d-md-inline ms-1">Customer</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={busyId === r.id || r.role === 'product_manager'}
                      onClick={() => void applyRole(r, 'product_manager')}
                      title="Product manager"
                    >
                      <i className="bi bi-kanban" aria-hidden />
                      <span className="d-none d-md-inline ms-1">PM</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={busyId === r.id || r.role === 'admin'}
                      onClick={() => void applyRole(r, 'admin')}
                      title="Administrator"
                    >
                      <i className="bi bi-shield-fill-check" aria-hidden />
                      <span className="d-none d-md-inline ms-1">Admin</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
