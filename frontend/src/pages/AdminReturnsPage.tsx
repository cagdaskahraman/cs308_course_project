import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import {
  approveReturn,
  listAdminReturns,
  rejectReturn,
  type ReturnRequest,
} from '../services/returnService';
import { formatPrice } from '../utils/formatPrice';

const statusLabel = (status: ReturnRequest['status']): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
};

export const AdminReturnsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { showToast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManageReturns = user?.role === 'sales_manager';

  const load = useCallback(async () => {
    if (!canManageReturns) return;
    setError('');
    try {
      const rows = await listAdminReturns('pending');
      setReturns(rows);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/returns', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load return requests');
    }
  }, [canManageReturns, navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/returns', { replace: true });
      return;
    }
    if (!canManageReturns) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [canManageReturns, isAuthenticated, load, navigate]);

  const handleApprove = async (returnId: string) => {
    setBusyId(returnId);
    try {
      await approveReturn(returnId);
      setReturns((prev) => prev.filter((row) => row.id !== returnId));
      showToast('Return approved and refund issued.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve return');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (returnId: string) => {
    setBusyId(returnId);
    try {
      await rejectReturn(returnId);
      setReturns((prev) => prev.filter((row) => row.id !== returnId));
      showToast('Return request rejected.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reject return');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <Link to="/login?next=/admin/returns" className="btn btn-primary">
          Log in
        </Link>
      </div>
    );
  }

  if (!canManageReturns) {
    return (
      <div className="alert alert-warning mt-5">
        Only sales managers can review return requests.
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading return requests…" />;

  return (
    <>
      <AdminModerationNav active="returns" />
      <PageHeader
        icon="bi-arrow-counterclockwise"
        title="Return requests"
        subtitle="Review customer return requests, restore stock, and issue refunds at the purchase price."
        badge={`${returns.length} requests`}
      />
      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      {returns.length === 0 ? (
        <EmptyState
          icon="bi-inbox"
          title="No return requests"
          description="Customer return requests will appear here for review."
        />
      ) : (
        <div className="table-responsive data-card">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Refund</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((row) => (
                <tr key={row.id}>
                  <td>{row.productName}</td>
                  <td>{row.quantity}</td>
                  <td>{formatPrice(row.refundAmount)}</td>
                  <td className="small">{row.reason ?? '—'}</td>
                  <td>{new Date(row.requestedAt).toLocaleString()}</td>
                  <td>
                    <span className="badge text-bg-light">{statusLabel(row.status)}</span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        disabled={busyId === row.id}
                        onClick={() => void handleApprove(row.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        disabled={busyId === row.id}
                        onClick={() => void handleReject(row.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
