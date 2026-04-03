import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { ProductListing } from './Pages/ProductListing';
import { ProductDetail } from './Pages/ProductDetail';

export const App = (): JSX.Element => {
  return (
    <BrowserRouter>
      <div className="app-bg min-vh-100">
        <header className="border-bottom bg-white shadow-sm">
          <div className="container py-4">
            <Link to="/" className="text-decoration-none text-dark">
              <h1 className="display-6 fw-bold mb-1">ElectroStore</h1>
            </Link>
            <p className="text-secondary mb-0">Featured Products</p>
          </div>
        </header>

        <main className="container py-4">
          <Routes>
            <Route path="/" element={<ProductListing />} />
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
