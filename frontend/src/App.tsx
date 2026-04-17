import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AnnouncementTicker } from './components/AnnouncementTicker';
import { ScrollProgress } from './components/ScrollProgress';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminReviewsPage } from './pages/AdminReviewsPage';

export const App = (): JSX.Element => {
  const { pathname } = useLocation();
  const isAuth = pathname === '/login' || pathname === '/register';

  return (
    <div className="app-bg">
      <ScrollProgress />
      {!isAuth && <AnnouncementTicker />}
      <Navbar />
      {isAuth ? (
        <main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      ) : (
        <main className="es-page">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          </Routes>
        </main>
      )}
    </div>
  );
};
