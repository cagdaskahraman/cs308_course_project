import { useEffect, useMemo, useState } from 'react';
import { getCategories, getProducts } from './services/productService';
import type { Product } from './types/product';

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(price);

export const App = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await getCategories();
        setCategories(list);
      } catch (err) {
        console.error('Could not load categories:', err);
      }
    };
    void fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const list = await getProducts(selectedCategory);
        setProducts(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(`Could not load products: ${message}`);
      } finally {
        setLoading(false);
      }
    };
    void fetchProducts();
  }, [selectedCategory]);

  const categoryPills = (
    <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
      <button
        className={`btn btn-sm rounded-pill ${selectedCategory === null ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
        onClick={() => setSelectedCategory(null)}
      >
        All Products
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`btn btn-sm rounded-pill ${selectedCategory === cat ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-center fs-5 mt-5">Loading products...</p>;
    }

    if (error) {
      return (
        <div className="alert alert-danger mt-4" role="alert">
          {error}
        </div>
      );
    }

    if (products.length === 0) {
      return <p className="text-center fs-5 mt-5">No products found.</p>;
    }

    return (
      <div className="row g-4">
        {products.map((product) => (
          <div className="col-12 col-md-6 col-lg-4" key={product.id}>
            <article className="card product-card h-100 border-0 shadow-sm">
              <img className="card-img-top product-image" src={product.imageUrl} alt={product.name} />
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title mb-0">{product.name}</h5>
                  <span className="badge text-bg-dark">{product.category}</span>
                </div>
                <p className="card-text text-secondary flex-grow-1">{product.description}</p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="fw-bold fs-5 text-primary">{formatPrice(product.price)}</span>
                  <span className="small text-secondary">Stock: {product.stockQuantity}</span>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    );
  }, [error, loading, products]);

  return (
    <div className="app-bg min-vh-100">
      <header className="border-bottom bg-white shadow-sm">
        <div className="container py-4">
          <h1 className="display-6 fw-bold mb-1">ElectroStore</h1>
          <p className="text-secondary mb-0">Featured Products</p>
        </div>
      </header>
      <main className="container py-4">
        {categoryPills}
        {content}
      </main>
    </div>
  );
};

