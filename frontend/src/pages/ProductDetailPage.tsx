import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getOrCreateCartId, addCartItem } from '../services/cartService';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';
import type { Product } from '../types/product';

export const ProductDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    void getProductById(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!product || product.stockQuantity <= 0) return;
    setAdding(true);
    try {
      const cartId = await getOrCreateCartId();
      await addCartItem(cartId, product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="text-center fs-5 mt-5">Loading...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!product) return <div className="alert alert-warning mt-4">Product not found.</div>;

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="img-fluid rounded shadow-sm"
          style={{ maxHeight: 480, objectFit: 'cover', width: '100%' }}
        />
      </div>
      <div className="col-md-6">
        <span className="badge text-bg-dark mb-2">{product.category}</span>
        <h2 className="fw-bold">{product.name}</h2>
        <p className="text-secondary">{product.description}</p>
        <h3 className="text-primary fw-bold">{formatPrice(product.price)}</h3>
        <p className={`mt-2 ${product.stockQuantity > 0 ? 'text-success' : 'text-danger'}`}>
          {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
        </p>
        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-primary"
            disabled={product.stockQuantity <= 0 || adding}
            onClick={() => void handleAdd()}
          >
            {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
          </button>
          <Link to="/" className="btn btn-outline-secondary">Back to Catalog</Link>
        </div>
      </div>
    </div>
  );
};
