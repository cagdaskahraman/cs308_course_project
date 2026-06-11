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
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminPricingPage } from './pages/AdminPricingPage';
import { AdminReturnsPage } from './pages/AdminReturnsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App = (): JSX.Element => (
  <div className="app-bg min-vh-100">
    <div className="bg-orb bg-orb-one" aria-hidden />
    <div className="bg-orb bg-orb-two" aria-hidden />
    <Navbar />
    <main className="container py-4 py-lg-5 page-enter">
      <section className="content-shell p-3 p-lg-4">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/pricing" element={<AdminPricingPage />} />
          <Route path="/admin/returns" element={<AdminReturnsPage />} />
        </Routes>
      </section>
    </main>
  </div>
);
