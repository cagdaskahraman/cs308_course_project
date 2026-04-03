import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/productService';
import type { Product } from '../types/product';

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(price);

export const ProductListing = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('');
  
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
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        let sortBy: 'price' | 'popularity' | undefined;
        let sortOrder: 'asc' | 'desc' | undefined;
        if (sortOption === 'price_asc') { sortBy = 'price'; sortOrder = 'asc'; }
        else if (sortOption === 'price_desc') { sortBy = 'price'; sortOrder = 'desc'; }
        else if (sortOption === 'popularity_desc') { sortBy = 'popularity'; sortOrder = 'desc'; }

        const list = await getProducts({
          category: selectedCategory || undefined,
          search: searchQuery.trim() || undefined,
          sortBy,
          sortOrder
        });
        setProducts(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(`Could not load products: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    const debounceId = setTimeout(() => void load(), 300);
    return () => clearTimeout(debounceId);
  }, [searchQuery, sortOption, selectedCategory]);

  const filterHeader = (
    <div className="row align-items-center mb-4 gy-3">
      {/* Search Input - Left */}
      <div className="col-12 col-lg-3">
        <input
          type="text"
          className="form-control shadow-sm"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Pills - Center */}
      <div className="col-12 col-lg-6 d-flex flex-wrap gap-2 justify-content-lg-center">
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

      {/* Sort Select - Right */}
      <div className="col-12 col-lg-3 d-flex justify-content-lg-end">
        <select
          className="form-select shadow-sm"
          style={{ maxWidth: '200px' }}
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="">Sort By...</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popularity_desc">Popularity: Best Sellers</option>
        </select>
      </div>
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
      return <p className="text-center fs-5 mt-5">No products found for your criteria.</p>;
    }

    return (
      <div className="row g-4">
        {products.map((product) => (
          <div className="col-12 col-md-6 col-lg-4" key={product.id}>
            <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
              <article className={`card product-card h-100 border-0 shadow-sm ${product.stockQuantity === 0 ? 'opacity-50' : ''}`}>
                <img className="card-img-top product-image" src={product.imageUrl} alt={product.name} />
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{product.name}</h5>
                    <span className="badge text-bg-dark">{product.category}</span>
                  </div>
                  <p className="card-text text-secondary flex-grow-1">{product.description}</p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold fs-5 text-primary">{formatPrice(product.price)}</span>
                    {product.stockQuantity === 0 ? (
                      <span className="badge bg-danger">Out of Stock</span>
                    ) : (
                      <span className="small text-secondary">Stock: {product.stockQuantity}</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          </div>
        ))}
      </div>
    );
  }, [error, loading, products]);

  return (
    <>
      {filterHeader}
      {content}
    </>
  );
};
