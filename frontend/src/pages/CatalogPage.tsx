import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { formatPrice } from '../utils/formatPrice';
import type { Product } from '../types/product';

export const CatalogPage = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    void getCategories()
      .then(setCategories)
      .catch((e) => console.error('Could not load categories:', e));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    void getProducts(selectedCategory)
      .then(setProducts)
      .catch((e) => setError(`Could not load products: ${e instanceof Error ? e.message : 'Unexpected error'}`))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const handleAddToCart = async (product: Product) => {
    if (product.stockQuantity <= 0) return;
    setAddingId(product.id);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const content = useMemo(() => {
    if (loading) return <p className="text-center fs-5 mt-5">Loading products...</p>;
    if (error) return <div className="alert alert-danger mt-4">{error}</div>;
    if (products.length === 0) return <p className="text-center fs-5 mt-5">No products found.</p>;

    return (
      <div className="row g-4">
        {products.map((product) => (
          <div className="col-12 col-md-6 col-lg-4" key={product.id}>
            <article className="card product-card h-100 border-0 shadow-sm">
              <Link to={`/products/${product.id}`}>
                <img className="card-img-top product-image" src={product.imageUrl} alt={product.name} />
              </Link>
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
                    <h5 className="card-title mb-0">{product.name}</h5>
                  </Link>
                  <span className="badge text-bg-dark">{product.category}</span>
                </div>
                <p className="card-text text-secondary flex-grow-1">{product.description}</p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="fw-bold fs-5 text-primary">{formatPrice(product.price)}</span>
                  <span className="small text-secondary">Stock: {product.stockQuantity}</span>
                </div>
                <button
                  className="btn btn-primary btn-sm mt-3 w-100"
                  disabled={product.stockQuantity <= 0 || addingId === product.id}
                  onClick={() => void handleAddToCart(product)}
                >
                  {product.stockQuantity <= 0
                    ? 'Out of Stock'
                    : addingId === product.id
                      ? 'Adding...'
                      : 'Add to Cart'}
                </button>
              </div>
            </article>
          </div>
        ))}
      </div>
    );
  }, [error, loading, products, addingId]);

  return (
    <>
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
      {content}
    </>
  );
};
