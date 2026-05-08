import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import {
  getAllOrdersForStaff,
  updateOrderItemStatus,
  updateOrderStatus,
  type Order,
} from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';

const statusLabel = (value: string): string => {
  switch (value) {
    case 'processing':
      return 'Processing';
    case 'in-transit':
      return 'In transit';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return value;
  }
};

const nextTransitions: Record<string, Array<'in-transit' | 'delivered'>> = {
  processing: ['in-transit'],
  'in-transit': ['delivered'],
  delivered: [],
  cancelled: [],
};

const nextItemTransitions: Record<
  string,
  Array<'in-transit' | 'delivered'>
> = {
  processing: ['in-transit'],
  'in-transit': ['delivered'],
  delivered: [],
};

export const AdminOrdersPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { showToast } = useToast();

  const canManageOrders =
    user?.role === 'product_manager' || user?.role === 'admin';

  const load = useCallback(async () => {
    if (!canManageOrders) return;
    setError('');
    try {
      const rows = await getAllOrdersForStaff();
      setOrders(rows);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    }
  }, [canManageOrders, navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/orders', { replace: true });
      return;
    }
    if (!canManageOrders) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [canManageOrders, isAuthenticated, load, navigate]);

  const applyStatus = async (
    orderId: string,
    nextStatus: 'in-transit' | 'delivered',
  ) => {
    setBusyOrderId(orderId);
    setError('');
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      showToast(`Order moved to ${statusLabel(nextStatus)}.`, 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(
        e instanceof Error ? e.message : 'Could not update order status',
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const applyItemStatus = async (
    orderId: string,
    itemId: string,
    nextStatus: 'in-transit' | 'delivered',
  ) => {
    setBusyItemId(itemId);
    setError('');
    try {
      const updated = await updateOrderItemStatus(orderId, itemId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      showToast(`Order item moved to ${statusLabel(nextStatus)}.`, 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(
        e instanceof Error ? e.message : 'Could not update item status',
      );
    } finally {
      setBusyItemId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <i
          className="bi bi-shield-lock display-4 text-secondary mb-3 d-block"
          aria-hidden
        />
        <h4 className="fw-semibold">Please log in to access this page</h4>
        <Link
          to="/login?next=/admin/orders"
          className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-box-arrow-in-right" aria-hidden />
          Log in
        </Link>
      </div>
    );
  }

  if (!canManageOrders) {
    return (
      <div className="alert alert-warning mt-5 d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden />
        <span>
          Only product managers and administrators can manage delivery status.
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading orders…</p>
      </div>
    );
  }

  return (
    <>
      <AdminModerationNav active="orders" />
      <h2 className="fw-bold mb-2 d-inline-flex align-items-center gap-2">
        <i className="bi bi-truck text-primary" aria-hidden />
        Delivery management
      </h2>
      <p className="text-secondary mb-4">
        Advance order statuses from processing to in-transit, then to delivered.
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
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Delivery address</th>
              <th scope="col">Items</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const actions = nextTransitions[order.status] ?? [];
              const expanded = expandedOrderId === order.id;
              return (
                <Fragment key={order.id}>
                  <tr>
                    <td className="small text-break">{order.id}</td>
                    <td>{new Date(order.orderDate).toLocaleString()}</td>
                    <td className="small">{order.deliveryAddress ?? 'N/A'}</td>
                    <td>{order.items.length}</td>
                    <td className="fw-semibold">{formatPrice(order.totalPrice)}</td>
                    <td>
                      <span className="badge text-bg-light">{statusLabel(order.status)}</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() =>
                          setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                        }
                      >
                        {expanded ? 'Hide items' : 'View items'}
                      </button>
                      {actions.length === 0 ? (
                        <span className="text-secondary small">No actions</span>
                      ) : (
                        <div className="btn-group btn-group-sm" role="group">
                          {actions.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              className="btn btn-outline-primary"
                              disabled={busyOrderId === order.id}
                              onClick={() => void applyStatus(order.id, nextStatus)}
                            >
                              Mark all as {statusLabel(nextStatus)}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td colSpan={7} className="bg-light">
                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Item status</th>
                                <th className="text-end">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => {
                                const itemActions = nextItemTransitions[item.status] ?? [];
                                return (
                                  <tr key={item.id}>
                                    <td>{item.product.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatPrice(item.priceAtPurchase)}</td>
                                    <td>
                                      <span className="badge text-bg-light">
                                        {statusLabel(item.status)}
                                      </span>
                                    </td>
                                    <td className="text-end">
                                      {itemActions.length === 0 ? (
                                        <span className="text-secondary small">No actions</span>
                                      ) : (
                                        <div className="btn-group btn-group-sm">
                                          {itemActions.map((nextStatus) => (
                                            <button
                                              key={nextStatus}
                                              type="button"
                                              className="btn btn-outline-primary"
                                              disabled={busyItemId === item.id}
                                              onClick={() =>
                                                void applyItemStatus(order.id, item.id, nextStatus)
                                              }
                                            >
                                              {statusLabel(nextStatus)}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
