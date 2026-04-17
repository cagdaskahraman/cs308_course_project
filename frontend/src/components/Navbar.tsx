import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();

  const navLink = (to: string, label: string) => (
    <li className="nav-item" key={to}>
      <Link
        className={`nav-link${pathname === to ? ' active fw-semibold' : ''}`}
        to={to}
      >
        {label}
      </Link>
    </li>
  );

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-md bg-white border-bottom shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" to="/">
          ElectroStore
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto gap-1 align-items-md-center">
            {navLink('/', 'Catalog')}
            {navLink('/cart', 'Cart')}
            {user?.role === 'product_manager' && navLink('/admin/reviews', 'Moderation')}
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-secondary small">
                    {user?.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary ms-md-2"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                {navLink('/login', 'Login')}
                {navLink('/register', 'Register')}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
