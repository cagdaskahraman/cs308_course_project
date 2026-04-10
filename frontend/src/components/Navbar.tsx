import { Link, useLocation } from 'react-router-dom';

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();

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
          </ul>
        </div>
      </div>
    </nav>
  );
};
