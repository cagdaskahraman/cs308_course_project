import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAuthFailure } from '../services/authService';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { RevenueChart } from '../components/RevenueChart';
import {
  applyProductDiscount,
  getRevenueChart,
  getRevenueSummary,
  listPricingProducts,
  listSalesInvoices,
  updateProductPricing,
  type InvoiceSummary,
  type PricingProduct,
  type RevenueChartPoint,
  type RevenueSummary,
} from '../services/pricingService';
import { downloadInvoicePdf } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { computeSalePrice } from '../utils/productPricing';

export const AdminPricingPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { showToast } = useToast();

  const canManageSales = user?.role === 'sales_manager';
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [discountRate, setDiscountRate] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [chartPoints, setChartPoints] = useState<RevenueChartPoint[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { listPrice: string; discountRate: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const syncDraftsFromProducts = useCallback((items: PricingProduct[]) => {
    setDrafts(
      Object.fromEntries(
        items.map((p) => [
          p.id,
          {
            listPrice: String(p.listPrice ?? p.price ?? 0),
            discountRate: String(p.discountRate ?? 0),
          },
        ]),
      ),
    );
  }, []);

  const load = useCallback(async () => {
    if (!canManageSales) return;
    setError('');
    try {
      const nextProducts = await listPricingProducts();
      setProducts(nextProducts);
      syncDraftsFromProducts(nextProducts);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load pricing data');
    }
  }, [canManageSales, navigate, signOut, syncDraftsFromProducts]);

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
      setDrafts((prev) => ({
        ...prev,
        [updated.id]: {
          listPrice: String(updated.listPrice ?? updated.price ?? 0),
          discountRate: String(updated.discountRate ?? 0),
        },
      }));
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
      setDrafts((prev) => {
        const next = { ...prev };
        for (const item of updated) {
          next[item.id] = {
            listPrice: String(item.listPrice ?? item.price ?? 0),
            discountRate: String(item.discountRate ?? 0),
          };
        }
        return next;
      });
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
      const [summary, invoices, chart] = await Promise.all([
        getRevenueSummary(fromDate, toDate),
        listSalesInvoices(fromDate, toDate),
        getRevenueChart(fromDate, toDate),
      ]);
      setRevenue(summary);
      setChartPoints(chart);
      setInvoices(invoices);
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/pricing', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not load sales reports');
    }
  };

  const handleInvoiceDownload = async (orderId: string, invoiceNumber: string) => {
    setDownloadingOrderId(orderId);
    try {
      const blob = await downloadInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not download invoice');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const pricedCount = useMemo(
    () => products.filter((p) => (p.listPrice ?? p.price) > 0).length,
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, searchQuery]);

  const previewSalePrice = (productId: string): string => {
    const draft = drafts[productId];
    const listPrice = Number(draft?.listPrice);
    const rate = Number(draft?.discountRate);
    if (!Number.isFinite(listPrice) || listPrice <= 0) return '—';
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return '—';
    return formatPrice(computeSalePrice(listPrice, rate));
  };

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
        Only sales managers can manage pricing and sales reports.
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading sales management…" />;

  return (
    <>
      <AdminModerationNav active="pricing" />
      <PageHeader
        icon="bi-currency-exchange"
        title="Sales management"
        subtitle="Set list prices, apply discounts, and review revenue for the selected period."
        badge={`${filteredProducts.length} products`}
      />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="content-card mb-4">
        <label className="form-label" htmlFor="pricingSearch">Search by product name</label>
        <input
          id="pricingSearch"
          type="search"
          className="form-control"
          placeholder="Type a product name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="stat-card h-100">
              <div className="stat-card__label">Priced products</div>
              <div className="stat-card__value">{pricedCount}</div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="content-card h-100 mb-0">
              <h2 className="content-card__title">
                <i className="bi bi-percent" aria-hidden />
                Bulk discount
              </h2>
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

      <div className="table-responsive data-card mb-4">
        <table className="table table-hover align-middle mb-0">
          <thead>
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-secondary text-center py-4">
                  No products match your search.
                </td>
              </tr>
            ) : null}
            {filteredProducts.map((product) => (
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
                <td className="fw-medium">{previewSalePrice(product.id)}</td>
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

      <div className="content-card mb-0">
          <h2 className="content-card__title">
            <i className="bi bi-graph-up-arrow" aria-hidden />
            Revenue report
          </h2>
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
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-card__label">Invoices</div>
                  <div className="stat-card__value">{revenue.invoiceCount}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-card__label">Total revenue</div>
                  <div className="stat-card__value">{formatPrice(revenue.totalRevenue)}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-card__label">Estimated cost</div>
                  <div className="stat-card__value">{formatPrice(revenue.totalCost)}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-card__label">Profit / loss</div>
                  <div className="stat-card__value">
                    {formatPrice(revenue.totalProfit)}
                    {revenue.totalLoss > 0 ? (
                      <span className="text-danger small ms-1">(-{formatPrice(revenue.totalLoss)})</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="revenue-chart-panel">
                  <div className="text-secondary small mb-3 fw-bold text-uppercase">Revenue, cost & profit chart</div>
                  <RevenueChart points={chartPoints} />
                </div>
              </div>
              <div className="col-12">
                <h3 className="h6 fw-bold mb-3">Invoices in selected period</h3>
                {invoices.length === 0 ? (
                  <p className="text-secondary mb-0">No invoices found for this date range.</p>
                ) : (
                  <div className="table-responsive data-card">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Customer</th>
                          <th>Issued</th>
                          <th>Total</th>
                          <th className="text-end">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="fw-semibold">{invoice.invoiceNumber}</td>
                            <td>
                              <div>{invoice.billingName}</div>
                              <div className="small text-secondary">{invoice.billingEmail}</div>
                            </td>
                            <td>{new Date(invoice.issuedAt).toLocaleString()}</td>
                            <td>{formatPrice(invoice.total)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                disabled={downloadingOrderId === invoice.orderId}
                                onClick={() => void handleInvoiceDownload(invoice.orderId, invoice.invoiceNumber)}
                              >
                                {downloadingOrderId === invoice.orderId ? 'Preparing…' : 'Download'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
      </div>
    </>
  );
};
