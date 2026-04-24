import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const canModerateReviews =
    user?.role === 'product_manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const navLink = (to: string, label: string, iconClass: string) => (
    <li className="nav-item" key={to}>
      <Link
        className={`nav-link d-inline-flex align-items-center gap-2${pathname === to ? ' active fw-semibold' : ''}`}
        to={to}
      >
        <i className={`bi ${iconClass}`} aria-hidden />
        <span>{label}</span>
      </Link>
    </li>
  );

  const ordersActive = pathname === '/orders' || /^\/orders\/[^/]+$/.test(pathname);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-md bg-white border-bottom shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 d-inline-flex align-items-center gap-2" to="/">
          <i className="bi bi-lightning-charge-fill text-primary" aria-hidden />
          <span>ElectroStore</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto gap-1 align-items-md-center">
            {navLink('/', 'Catalog', 'bi-grid-1x2-fill')}
            {navLink('/cart', 'Cart', 'bi-cart3')}
            {isAuthenticated && (
              <li className="nav-item">
                <Link
                  className={`nav-link d-inline-flex align-items-center gap-2${ordersActive ? ' active fw-semibold' : ''}`}
                  to="/orders"
                >
                  <i className="bi bi-receipt" aria-hidden />
                  <span>Orders</span>
                </Link>
              </li>
            )}
            {canModerateReviews && navLink('/admin/reviews', 'Moderation', 'bi-shield-check')}
            {isAdmin && navLink('/admin/users', 'Users', 'bi-people-fill')}
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-secondary small d-inline-flex align-items-center gap-1">
                    <i className="bi bi-person-circle" aria-hidden />
                    {user?.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary ms-md-2 d-inline-flex align-items-center gap-2"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right" aria-hidden />
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                {navLink('/login', 'Login', 'bi-box-arrow-in-right')}
                {navLink('/register', 'Register', 'bi-person-plus')}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
