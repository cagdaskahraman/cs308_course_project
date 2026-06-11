import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import {
  applyProductDiscount,
  getRevenueSummary,
  listPricingProducts,
  listSalesInvoices,
  updateProductPricing,
  type PricingProduct,
  type RevenueSummary,
} from '../services/pricingService';
import { formatPrice } from '../utils/formatPrice';

export const AdminPricingPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { showToast } = useToast();

  const canManageSales = user?.role === 'sales_manager' || user?.role === 'admin';
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [discountRate, setDiscountRate] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, { listPrice: string; discountRate: string }>>({});

  const load = useCallback(async () => {
    if (!canManageSales) return;
    setError('');
    try {
      const nextProducts = await listPricingProducts();
      setProducts(nextProducts);
      setDrafts(
        Object.fromEntries(
          nextProducts.map((p) => [
            p.id,
            {
              listPrice: String(p.listPrice ?? p.price ?? 0),
              discountRate: String(p.discountRate ?? 0),
            },
          ]),
        ),
      );
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load pricing data');
    }
  }, [canManageSales, navigate, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/pricing', { replace: true });
      return;
    }
    if (!canManageSales) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [canManageSales, isAuthenticated, load, navigate]);

  const toggleSelected = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const savePricing = async (product: PricingProduct) => {
    const draft = drafts[product.id];
    const listPrice = Number(draft?.listPrice);
    const rate = Number(draft?.discountRate);
    if (!Number.isFinite(listPrice) || listPrice <= 0) {
      setError('List price must be greater than zero.');
      return;
    }
    if (!Number.isInteger(rate) || rate < 0 || rate > 100) {
      setError('Discount rate must be between 0 and 100.');
      return;
    }
    setBusyId(product.id);
    setError('');
    try {
      const updated = await updateProductPricing(product.id, {
        listPrice,
        discountRate: rate,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast('Pricing updated.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not update pricing');
    } finally {
      setBusyId(null);
    }
  };

  const applyDiscount = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      setError('Select at least one product for discount.');
      return;
    }
    setError('');
    try {
      const updated = await applyProductDiscount({
        productIds: selectedIds,
        discountRate,
      });
      setProducts((prev) =>
        prev.map((p) => updated.find((item) => item.id === p.id) ?? p),
      );
      showToast(`Discount applied to ${updated.length} product(s).`, 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not apply discount');
    }
  };

  const loadReports = async () => {
    setError('');
    try {
      const [summary, invoices] = await Promise.all([
        getRevenueSummary(fromDate, toDate),
        listSalesInvoices(fromDate, toDate),
      ]);
      setRevenue(summary);
      setInvoiceCount(invoices.length);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not load sales reports');
    }
  };

  const pricedCount = useMemo(
    () => products.filter((p) => (p.listPrice ?? p.price) > 0).length,
    [products],
  );

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <Link to="/login?next=/admin/pricing" className="btn btn-primary mt-3">
          Log in
        </Link>
      </div>
    );
  }

  if (!canManageSales) {
    return (
      <div className="alert alert-warning mt-5">
        Only sales managers and administrators can manage pricing and sales reports.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-5">Loading sales management…</div>;
  }

  return (
    <>
      <AdminModerationNav active="pricing" />
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Sales management</h2>
        <p className="text-secondary mb-0">
          Set list prices, apply discounts, and review revenue for the selected period.
        </p>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">Priced products</div>
              <div className="fs-3 fw-bold">{pricedCount}</div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Bulk discount</h5>
              <form className="row g-2 align-items-end" onSubmit={(e) => void applyDiscount(e)}>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="discountRate">Discount %</label>
                  <input
                    id="discountRate"
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary">
                    Apply to selected ({selectedIds.length})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive shadow-sm rounded border bg-white mb-4">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th />
              <th>Product</th>
              <th>List price</th>
              <th>Discount %</th>
              <th>Sale price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelected(product.id)}
                    aria-label={`Select ${product.name}`}
                  />
                </td>
                <td>{product.name}</td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={drafts[product.id]?.listPrice ?? '0'}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [product.id]: {
                          ...prev[product.id],
                          listPrice: e.target.value,
                        },
                      }))
                    }
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={drafts[product.id]?.discountRate ?? '0'}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [product.id]: {
                          ...prev[product.id],
                          discountRate: e.target.value,
                        },
                      }))
                    }
                  />
                </td>
                <td>{formatPrice(product.price)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={busyId === product.id}
                    onClick={() => void savePricing(product)}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Revenue report</h5>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-md-3">
              <label className="form-label" htmlFor="fromDate">From</label>
              <input id="fromDate" type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="toDate">To</label>
              <input id="toDate" type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button type="button" className="btn btn-outline-primary" onClick={() => void loadReports()}>
                Load report
              </button>
            </div>
          </div>
          {revenue ? (
            <div className="row g-3">
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <div className="text-secondary small">Invoices</div>
                  <div className="fs-4 fw-semibold">{invoiceCount}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <div className="text-secondary small">Total revenue</div>
                  <div className="fs-4 fw-semibold">{formatPrice(revenue.totalRevenue)}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <div className="text-secondary small">Average order value</div>
                  <div className="fs-4 fw-semibold">{formatPrice(revenue.averageOrderValue)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
