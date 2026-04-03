import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import type { Product } from '../types/product';

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(price);

export const ProductDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(`Could not load product details: ${message}`);
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id]);

  if (loading) {
    return <p className="text-center fs-5 mt-5">Loading product details...</p>;
  }

  if (error || !product) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-danger" role="alert">{error || 'Product not found'}</div>
        <Link to="/" className="btn btn-outline-primary mt-3">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <Link to="/" className="btn btn-light border shadow-sm mb-4">
        &larr; Back to Products
      </Link>

      <div className="row gx-5">
        <div className="col-12 col-md-6 mb-4">
          <img src={product.imageUrl} alt={product.name} className="img-fluid rounded shadow-sm w-100" />
        </div>
        
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center mb-2 gap-2">
            <span className="badge bg-dark">{product.category}</span>
            {product.stockQuantity === 0 ? (
              <span className="badge bg-danger">Out of Stock</span>
            ) : (
              <span className="badge bg-success">In Stock ({product.stockQuantity})</span>
            )}
          </div>

          <h2 className="display-5 fw-bold mb-3">{product.name}</h2>
          <h3 className="text-primary fw-bold mb-4">{formatPrice(product.price)}</h3>
          
          <p className="fs-5 text-secondary mb-4">{product.description}</p>

          <div className="card border-0 shadow-sm mb-4 bg-light">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">Product Specifications</h5>
              <table className="table table-borderless table-sm mb-0">
                <tbody>
                  {product.model && (
                    <tr>
                      <th scope="row" className="text-muted w-25">Model</th>
                      <td>{product.model}</td>
                    </tr>
                  )}
                  {product.serialNumber && (
                    <tr>
                      <th scope="row" className="text-muted">Serial Number</th>
                      <td>{product.serialNumber}</td>
                    </tr>
                  )}
                  {product.warrantyStatus && (
                    <tr>
                      <th scope="row" className="text-muted">Warranty</th>
                      <td>{product.warrantyStatus}</td>
                    </tr>
                  )}
                  {product.distributorInfo && (
                    <tr>
                      <th scope="row" className="text-muted">Distributor</th>
                      <td>{product.distributorInfo}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-lg w-100 shadow-sm"
            disabled={product.stockQuantity === 0}
            onClick={() => alert('Add to cart clicked')}
          >
            {product.stockQuantity === 0 ? 'Currently Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
