import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminModerationNav } from '../components/AdminModerationNav';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
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
  uploadProductImage,
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState<AdminProductPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const canManageCatalog =
    user?.role === 'product_manager';

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
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

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
    setImagePreview(null);
    setImageMode('upload');
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm(toForm(product));
    setImagePreview(product.imageUrl || null);
    setImageMode(product.imageUrl ? 'url' : 'upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateFormField = <K extends keyof AdminProductPayload>(
    key: K,
    value: AdminProductPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError('');
    try {
      const imageUrl = await uploadProductImage(file);
      updateFormField('imageUrl', imageUrl);
      setImagePreview(URL.createObjectURL(file));
      showToast('Image uploaded.', 'success');
    } catch (e) {
      if (isAuthFailure(e)) {
        signOut();
        navigate('/login?next=/admin/products', { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
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
        <span>Only product managers can manage catalog products.</span>
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading catalog management…" />;

  return (
    <>
      <AdminModerationNav active="products" />
      <PageHeader
        icon="bi-box-seam"
        title="Catalog management"
        subtitle="Add products, manage stock, and maintain category names. Pricing is handled by sales managers."
        badge={`${products.length} products`}
      >
        <button type="button" className="btn btn-outline-primary" onClick={resetForm}>
          <i className="bi bi-plus-lg me-1" aria-hidden />
          New product
        </button>
      </PageHeader>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="row g-4 admin-products-layout">
        <div className="col-12 col-xl-4">
          <div className="content-card">
              <h2 className="content-card__title">
                <i className="bi bi-pencil-square" aria-hidden />
                {editingId ? 'Edit product' : 'Create product'}
              </h2>
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
                    <label className="form-label">Product image</label>
                    <div className="btn-group btn-group-sm mb-2 w-100" role="group">
                      <button
                        type="button"
                        className={`btn ${imageMode === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setImageMode('upload')}
                      >
                        <i className="bi bi-upload me-1" aria-hidden /> Upload file
                      </button>
                      <button
                        type="button"
                        className={`btn ${imageMode === 'url' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setImageMode('url')}
                      >
                        <i className="bi bi-link-45deg me-1" aria-hidden /> Paste URL
                      </button>
                    </div>
                    {imageMode === 'upload' ? (
                      <div>
                        <input
                          id="productImageFile"
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleImageUpload(file);
                          }}
                        />
                        <div className="form-text">
                          {uploadingImage ? 'Uploading…' : 'JPEG, PNG, GIF, or WebP — max 5 MB'}
                        </div>
                      </div>
                    ) : (
                      <input
                        id="productImageUrl"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={form.imageUrl}
                        onChange={(e) => {
                          updateFormField('imageUrl', e.target.value);
                          setImagePreview(e.target.value || null);
                        }}
                      />
                    )}
                    {(imagePreview || form.imageUrl) ? (
                      <div className="mt-2">
                        <img
                          src={imagePreview || form.imageUrl}
                          alt="Preview"
                          style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid #dee2e6' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          onLoad={(e) => { (e.target as HTMLImageElement).style.display = ''; }}
                        />
                      </div>
                    ) : null}
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

          <div className="content-card">
              <h2 className="content-card__title">
                <i className="bi bi-tags" aria-hidden />
                Categories
              </h2>
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

        <div className="col-12 col-xl-8">
          <div className="content-card">
            <h2 className="content-card__title">
              <i className="bi bi-funnel" aria-hidden />
              Product inventory
            </h2>
            <div className="row g-2">
              <div className="col-md-8">
                <label className="form-label" htmlFor="productSearch">Search by product name</label>
                <input
                  id="productSearch"
                  type="search"
                  className="form-control"
                  placeholder="Type a product name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="categoryFilter">Category</label>
                <select id="categoryFilter" className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">All categories</option>
                  {sortedCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="admin-table-wrap data-card">
            <table className="table table-hover align-middle mb-0 admin-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="admin-products-table__col-narrow">Category</th>
                  <th className="admin-products-table__col-narrow">Price</th>
                  <th className="admin-products-table__col-stock">Stock</th>
                  <th className="admin-products-table__col-actions text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const draft = stockDrafts[product.id] ?? String(product.stockQuantity);
                  return (
                    <tr key={product.id}>
                      <td className="admin-products-table__product">
                        <div className="fw-semibold">{product.name}</div>
                        <div className="small text-secondary">
                          {product.model ?? 'N/A'} · {product.serialNumber ?? 'No serial'}
                        </div>
                      </td>
                      <td className="admin-products-table__col-narrow">
                        <span className="badge text-bg-light">{product.category}</span>
                      </td>
                      <td className="admin-products-table__col-narrow text-nowrap">
                        {product.price > 0 ? formatPrice(product.price) : 'Price unavailable'}
                      </td>
                      <td className="admin-products-table__col-stock">
                        <div className="stock-editor">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary stock-editor__step"
                            aria-label="Decrease stock"
                            disabled={busyId === product.id || product.stockQuantity === 0}
                            onClick={() => void applyStock(product, Math.max(0, product.stockQuantity - 1))}
                          >
                            <i className="bi bi-dash-lg" aria-hidden />
                          </button>
                          <input
                            className="form-control form-control-sm stock-editor__input"
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Stock for ${product.name}`}
                            value={draft}
                            onChange={(e) => setStockDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary stock-editor__step"
                            aria-label="Increase stock"
                            disabled={busyId === product.id}
                            onClick={() => void applyStock(product, product.stockQuantity + 1)}
                          >
                            <i className="bi bi-plus-lg" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary stock-editor__save"
                            title="Save stock"
                            aria-label="Save stock"
                            disabled={busyId === product.id}
                            onClick={() => void applyStock(product)}
                          >
                            {busyId === product.id ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden />
                            ) : (
                              <i className="bi bi-check-lg" aria-hidden />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="admin-products-table__col-actions text-end">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            title="Edit product"
                            onClick={() => editProduct(product)}
                          >
                            <i className="bi bi-pencil" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Delete product"
                            disabled={busyId === product.id}
                            onClick={() => void removeProduct(product)}
                          >
                            <i className="bi bi-trash" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-4">
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
