import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminReviewsPage } from './pages/AdminReviewsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export const App = (): JSX.Element => (
  <div className="app-bg min-vh-100">
    <Navbar />
    <main className="container py-4 page-enter">
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Routes>
    </main>
  </div>
);
