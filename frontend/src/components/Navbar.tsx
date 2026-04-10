import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    logout();
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
          <ul className="navbar-nav ms-auto gap-1">
            {navLink('/', 'Catalog')}
            {navLink('/cart', 'Cart')}
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-secondary">{user.email}</span>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout}>
                    Logout
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
