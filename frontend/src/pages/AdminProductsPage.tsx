import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
  updateAdminProductStock,
  type AdminProductPayload,
} from '../services/adminProductService';
import { isAuthFailure } from '../services/authService';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/formatPrice';

const emptyForm: AdminProductPayload = {
  name: '',
  model: '',
  serialNumber: '',
  description: '',
  category: '',
  imageUrl: '',
  stockQuantity: 0,
  warrantyStatus: '',
  distributorInfo: '',
};

function toForm(product: Product): AdminProductPayload {
  return {
    name: product.name,
    model: product.model ?? '',
    serialNumber: product.serialNumber ?? '',
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    stockQuantity: product.stockQuantity,
    warrantyStatus: product.warrantyStatus ?? '',
    distributorInfo: product.distributorInfo ?? '',
  };
}

export const AdminProductsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState<AdminProductPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManageCatalog =
    user?.role === 'product_manager' || user?.role === 'admin';

  const load = useCallback(async () => {
    if (!canManageCatalog) return;
    setError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        listAdminProducts({ search, category: categoryFilter }),
        listAdminCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setStockDrafts(
        Object.fromEntries(
          nextProducts.map((p) => [p.id, String(p.stockQuantity)]),
        ),
      );
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load products');
    }
  }, [canManageCatalog, categoryFilter, navigate, search, signOut]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?next=/admin/products', { replace: true });
      return;
    }
    if (!canManageCatalog) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [canManageCatalog, isAuthenticated, load, navigate]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b)),
    [categories],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm(toForm(product));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateFormField = <K extends keyof AdminProductPayload>(
    key: K,
    value: AdminProductPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editingId
        ? await updateAdminProduct(editingId, form)
        : await createAdminProduct(form);
      setProducts((prev) => {
        if (!editingId) return [saved, ...prev];
        return prev.map((p) => (p.id === saved.id ? saved : p));
      });
      setStockDrafts((prev) => ({ ...prev, [saved.id]: String(saved.stockQuantity) }));
      if (!categories.some((c) => c.toLowerCase() === saved.category.toLowerCase())) {
        setCategories((prev) => [...prev, saved.category]);
      }
      showToast(editingId ? 'Product updated.' : 'Product created.', 'success');
      resetForm();
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const applyStock = async (product: Product, nextStock?: number) => {
    const parsed = nextStock ?? Number(stockDrafts[product.id]);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError('Stock must be a non-negative whole number.');
      return;
    }
    setBusyId(product.id);
    setError('');
    try {
      const updated = await updateAdminProductStock(product.id, parsed);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setStockDrafts((prev) => ({ ...prev, [updated.id]: String(updated.stockQuantity) }));
      showToast('Stock updated.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not update stock');
    } finally {
      setBusyId(null);
    }
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setBusyId(product.id);
    setError('');
    try {
      await deleteAdminProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast('Product deleted.', 'info');
      if (editingId === product.id) resetForm();
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not delete product');
    } finally {
      setBusyId(null);
    }
  };

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setError('');
    try {
      await createAdminCategory(name);
      setCategories((prev) =>
        prev.some((c) => c.toLowerCase() === name.toLowerCase())
          ? prev
          : [...prev, name],
      );
      setNewCategory('');
      showToast('Category added.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not add category');
    }
  };

  const removeCategory = async (name: string) => {
    if (!window.confirm(`Delete category ${name}?`)) return;
    setError('');
    try {
      await deleteAdminCategory(name);
      setCategories((prev) => prev.filter((c) => c !== name));
      if (categoryFilter === name) setCategoryFilter('');
      if (form.category === name) updateFormField('category', '');
      showToast('Category deleted.', 'info');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not delete category');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-lock display-4 text-secondary mb-3 d-block" aria-hidden />
        <h4 className="fw-semibold">Please log in to access this page</h4>
        <Link to="/login?next=/admin/products" className="btn btn-primary mt-3">
          Log in
        </Link>
      </div>
    );
  }

  if (!canManageCatalog) {
    return (
      <div className="alert alert-warning mt-5 d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden />
        <span>Only product managers and administrators can manage catalog products.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary" role="status">
        <div className="spinner-border text-primary mb-3" aria-hidden />
        <p className="fs-5 mb-0">Loading catalog management…</p>
      </div>
    );
  }

  return (
    <>
      <AdminModerationNav active="products" />
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-inline-flex align-items-center gap-2">
            <i className="bi bi-box-seam text-primary" aria-hidden />
            Catalog management
          </h2>
          <p className="text-secondary mb-0">
            Add products, manage stock, and maintain category names. Pricing is handled by sales managers.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary align-self-start" onClick={resetForm}>
          New product
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">
                {editingId ? 'Edit product' : 'Create product'}
              </h5>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productName">Name</label>
                    <input id="productName" className="form-control" value={form.name} onChange={(e) => updateFormField('name', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productModel">Model</label>
                    <input id="productModel" className="form-control" value={form.model} onChange={(e) => updateFormField('model', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productSerial">Serial number</label>
                    <input id="productSerial" className="form-control" value={form.serialNumber} onChange={(e) => updateFormField('serialNumber', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productCategory">Category</label>
                    <input id="productCategory" className="form-control" list="adminCategoryOptions" value={form.category} onChange={(e) => updateFormField('category', e.target.value)} required />
                    <datalist id="adminCategoryOptions">
                      {sortedCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productStock">Stock</label>
                    <input id="productStock" type="number" min="0" step="1" className="form-control" value={form.stockQuantity} onChange={(e) => updateFormField('stockQuantity', Number(e.target.value))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="productWarranty">Warranty</label>
                    <input id="productWarranty" className="form-control" value={form.warrantyStatus} onChange={(e) => updateFormField('warrantyStatus', e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="productImage">Image URL</label>
                    <input id="productImage" className="form-control" value={form.imageUrl} onChange={(e) => updateFormField('imageUrl', e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="productDistributor">Distributor info</label>
                    <input id="productDistributor" className="form-control" value={form.distributorInfo} onChange={(e) => updateFormField('distributorInfo', e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="productDescription">Description</label>
                    <textarea id="productDescription" className="form-control" rows={3} value={form.description} onChange={(e) => updateFormField('description', e.target.value)} required />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
                  </button>
                  {editingId ? (
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Categories</h5>
              <form className="d-flex gap-2 mb-3" onSubmit={(e) => void addCategory(e)}>
                <input className="form-control" placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                <button type="submit" className="btn btn-outline-primary">Add</button>
              </form>
              <div className="d-flex flex-wrap gap-2">
                {sortedCategories.map((category) => (
                  <span key={category} className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2">
                    {category}
                    <button type="button" className="btn-close btn-close-sm" aria-label={`Delete ${category}`} onClick={() => void removeCategory(category)} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-7">
                  <input className="form-control" placeholder="Search name, model, serial, description" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All categories</option>
                    {sortedCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 d-grid">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => void load()}>
                    Filter
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive shadow-sm rounded border bg-white">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Model / Serial</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const draft = stockDrafts[product.id] ?? String(product.stockQuantity);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                        <div className="small text-secondary text-truncate" style={{ maxWidth: 220 }}>
                          {product.description}
                        </div>
                      </td>
                      <td><span className="badge text-bg-light">{product.category}</span></td>
                      <td>{product.price > 0 ? formatPrice(product.price) : 'Awaiting pricing'}</td>
                      <td style={{ minWidth: 170 }}>
                        <div className="input-group input-group-sm">
                          <button type="button" className="btn btn-outline-secondary" disabled={busyId === product.id || product.stockQuantity === 0} onClick={() => void applyStock(product, Math.max(0, product.stockQuantity - 1))}>-</button>
                          <input className="form-control text-center" type="number" min="0" step="1" value={draft} onChange={(e) => setStockDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))} />
                          <button type="button" className="btn btn-outline-secondary" disabled={busyId === product.id} onClick={() => void applyStock(product, product.stockQuantity + 1)}>+</button>
                          <button type="button" className="btn btn-outline-primary" disabled={busyId === product.id} onClick={() => void applyStock(product)}>Save</button>
                        </div>
                      </td>
                      <td>
                        <div>{product.model ?? 'N/A'}</div>
                        <div className="small text-secondary">{product.serialNumber ?? 'No serial'}</div>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button type="button" className="btn btn-outline-primary" onClick={() => editProduct(product)}>Edit</button>
                          <button type="button" className="btn btn-outline-danger" disabled={busyId === product.id} onClick={() => void removeProduct(product)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-4">
                      No products found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
