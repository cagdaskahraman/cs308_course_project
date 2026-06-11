import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import {
  getAllOrdersForStaff,
  updateOrderItemStatus,
  updateOrderStatus,
  type StaffOrder,
} from '../services/orderService';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { formatPrice } from '../utils/formatPrice';

type ItemStatus = 'processing' | 'in-transit' | 'delivered';
type OrderStatusChoice = 'processing' | 'in-transit' | 'delivered' | 'cancelled';

type CustomerGroup = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  orders: StaffOrder[];
};

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

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'delivered':
      return 'status-badge status-badge--delivered';
    case 'in-transit':
      return 'status-badge status-badge--in-transit';
    case 'processing':
      return 'status-badge status-badge--processing';
    case 'cancelled':
      return 'status-badge status-badge--cancelled';
    default:
      return 'status-badge';
  }
};

const orderStatusOptions = (current: string): OrderStatusChoice[] => {
  const allowed: Record<string, OrderStatusChoice[]> = {
    processing: ['in-transit', 'cancelled'],
    'in-transit': ['delivered'],
    delivered: [],
    cancelled: [],
  };
  return [current as OrderStatusChoice, ...(allowed[current] ?? [])];
};

const itemStatusOptions = (current: string): ItemStatus[] => {
  const allowed: Record<string, ItemStatus[]> = {
    processing: ['in-transit'],
    'in-transit': ['delivered'],
    delivered: [],
  };
  return [current as ItemStatus, ...(allowed[current] ?? [])];
};

const shortRef = (id: string): string => id.slice(0, 8).toUpperCase();

const customerLabel = (order: StaffOrder): { name: string; email: string } => {
  const customer = order.customer;
  if (!customer) {
    return { name: 'Guest checkout', email: '—' };
  }
  return {
    name: customer.fullName?.trim() || customer.email,
    email: customer.email,
  };
};

function groupByCustomer(orders: StaffOrder[]): CustomerGroup[] {
  const groups = new Map<string, CustomerGroup>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const customerId = order.userId ?? `guest-${order.id}`;
    const { name, email } = customerLabel(order);
    const existing = groups.get(customerId);
    if (existing) {
      existing.orders.push(order);
    } else {
      groups.set(customerId, {
        customerId,
        customerName: name,
        customerEmail: email,
        orders: [order],
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      orders: [...group.orders].sort(
        (a, b) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
      ),
    }))
    .sort((a, b) => a.customerName.localeCompare(b.customerName));
}

type StatusControlProps = {
  value: string;
  options: string[];
  busy: boolean;
  onApply: (next: string) => void;
};

const StatusControl = ({
  value,
  options,
  busy,
  onApply,
}: StatusControlProps): JSX.Element => {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const changed = draft !== value;
  const canUpdate = changed && options.includes(draft);

  return (
    <div className="status-control">
      <select
        className="form-select form-select-sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={busy || options.length <= 1}
        aria-label="Delivery status"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabel(option)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={!canUpdate || busy}
        onClick={() => onApply(draft)}
      >
        {busy ? (
          <span className="spinner-border spinner-border-sm" aria-hidden />
        ) : (
          'Update'
        )}
      </button>
    </div>
  );
};

export const AdminOrdersPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useToast();

  const canManageOrders =
    user?.role === 'product_manager';

  const load = useCallback(async () => {
    if (!canManageOrders) return;
    setError('');
    try {
      const orderRows = await getAllOrdersForStaff();
      setOrders(orderRows);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load deliveries');
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

  const customerGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (order.status === 'cancelled') return false;
      if (statusFilter && order.status !== statusFilter) return false;
      if (!needle) return true;
      const { name, email } = customerLabel(order);
      const haystack = [
        name,
        email,
        order.id,
        order.deliveryAddress ?? '',
        ...order.items.map(
          (item) => `${item.product.name} ${item.product.id}`,
        ),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
    return groupByCustomer(filtered);
  }, [orders, search, statusFilter]);

  const activeOrderCount = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled').length,
    [orders],
  );

  const applyStatus = async (
    orderId: string,
    nextStatus: OrderStatusChoice,
  ) => {
    setBusyOrderId(orderId);
    setError('');
    try {
      await updateOrderStatus(orderId, nextStatus);
      await load();
      showToast(`Order updated to ${statusLabel(nextStatus)}.`, 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not update order status');
    } finally {
      setBusyOrderId(null);
    }
  };

  const applyItemStatus = async (
    orderId: string,
    itemId: string,
    nextStatus: ItemStatus,
  ) => {
    setBusyItemId(itemId);
    setError('');
    try {
      await updateOrderItemStatus(orderId, itemId, nextStatus);
      await load();
      showToast(`Item updated to ${statusLabel(nextStatus)}.`, 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/orders', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not update item status');
    } finally {
      setBusyItemId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <Link to="/login?next=/admin/orders" className="btn btn-primary mt-3">
          Log in
        </Link>
      </div>
    );
  }

  if (!canManageOrders) {
    return (
      <div className="alert alert-warning mt-5">
        Only product managers can manage deliveries.
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading deliveries…" />;

  return (
    <>
      <AdminModerationNav active="orders" />
      <PageHeader
        icon="bi-truck"
        title="Delivery management"
        subtitle="Review shipments by customer, update order progress, and mark individual items as delivered."
        badge={`${activeOrderCount} active orders`}
      />
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="content-card mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-7">
            <label className="form-label" htmlFor="deliverySearch">
              Search
            </label>
            <input
              id="deliverySearch"
              className="form-control"
              placeholder="Customer, email, order reference, product, or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="deliveryStatusFilter">
              Order status
            </label>
            <select
              id="deliveryStatusFilter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All active orders</option>
              <option value="processing">Processing</option>
              <option value="in-transit">In transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => void load()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {customerGroups.length === 0 ? (
        <div className="content-card text-center text-secondary py-5">
          No deliveries match your filters.
        </div>
      ) : (
        <div className="delivery-groups">
          {customerGroups.map((group) => (
            <section key={group.customerId} className="delivery-customer-group">
              <header className="delivery-customer-group__header">
                <div>
                  <h2 className="delivery-customer-group__name">
                    {group.customerName}
                  </h2>
                  <p className="delivery-customer-group__email mb-0">
                    {group.customerEmail}
                  </p>
                </div>
                <span className="badge text-bg-light">
                  {group.orders.length} order
                  {group.orders.length === 1 ? '' : 's'}
                </span>
              </header>

              {group.orders.map((order) => {
                const orderChoices = orderStatusOptions(order.status);
                return (
                  <article key={order.id} className="delivery-order-card">
                    <div className="delivery-order-card__head">
                      <div>
                        <div className="delivery-order-card__ref">
                          Order #{shortRef(order.id)}
                        </div>
                        <div className="delivery-order-card__meta">
                          <span>
                            {new Date(order.orderDate).toLocaleString('tr-TR')}
                          </span>
                          <span>{formatPrice(order.totalPrice)}</span>
                          <span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <div className="delivery-order-card__status">
                        <span className={statusBadgeClass(order.status)}>
                          {statusLabel(order.status)}
                        </span>
                        <StatusControl
                          value={order.status}
                          options={orderChoices}
                          busy={busyOrderId === order.id}
                          onApply={(next) =>
                            void applyStatus(order.id, next as OrderStatusChoice)
                          }
                        />
                      </div>
                    </div>

                    <div className="delivery-order-card__address">
                      <i className="bi bi-geo-alt" aria-hidden />
                      <span>{order.deliveryAddress?.trim() || 'No delivery address on file'}</span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0 delivery-items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Line total</th>
                            <th>Status</th>
                            <th className="text-end">Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => {
                            const itemChoices = itemStatusOptions(item.status);
                            const lineTotal =
                              item.quantity * Number(item.priceAtPurchase);
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div className="fw-semibold">
                                    {item.product.name}
                                  </div>
                                </td>
                                <td>{item.quantity}</td>
                                <td className="text-nowrap">
                                  {formatPrice(lineTotal)}
                                </td>
                                <td>
                                  <span
                                    className={statusBadgeClass(item.status)}
                                  >
                                    {statusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <StatusControl
                                    value={item.status}
                                    options={itemChoices}
                                    busy={busyItemId === item.id}
                                    onApply={(next) =>
                                      void applyItemStatus(
                                        order.id,
                                        item.id,
                                        next as ItemStatus,
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </>
  );
};
