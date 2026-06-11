import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { UserMenu } from './UserMenu';

type StaffLink = {
  to: string;
  label: string;
  icon: string;
  match: string;
};

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const staffRef = useRef<HTMLDivElement>(null);

  const isProductManager = user?.role === 'product_manager';
  const isSalesManager = user?.role === 'sales_manager';
  const hasStaffAccess = isProductManager || isSalesManager;

  const ordersActive = pathname === '/orders' || /^\/orders\/[^/]+$/.test(pathname);
  const staffActive = pathname.startsWith('/admin');

  const staffLinks: StaffLink[] = [
    ...(isProductManager
      ? [{ to: '/admin/orders', label: 'Deliveries', icon: 'bi-truck', match: '/admin/orders' }]
      : []),
    ...(isProductManager
      ? [{ to: '/admin/products', label: 'Catalog', icon: 'bi-box-seam', match: '/admin/products' }]
      : []),
    ...(isSalesManager
      ? [{ to: '/admin/pricing', label: 'Pricing & sales', icon: 'bi-currency-exchange', match: '/admin/pricing' }]
      : []),
    ...(isSalesManager
      ? [{ to: '/admin/returns', label: 'Returns', icon: 'bi-arrow-counterclockwise', match: '/admin/returns' }]
      : []),
    ...(isProductManager
      ? [{ to: '/admin/reviews', label: 'Reviews', icon: 'bi-shield-check', match: '/admin/reviews' }]
      : []),
  ];

  useEffect(() => {
    setNavOpen(false);
    setStaffOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!staffOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!staffRef.current?.contains(event.target as Node)) {
        setStaffOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStaffOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [staffOpen]);

  const navLink = (to: string, label: string, iconClass: string, active?: boolean) => (
    <li className="nav-item" key={to}>
      <Link
        className={`nav-link site-nav-link${(active ?? pathname === to) ? ' active' : ''}`}
        to={to}
        onClick={() => setNavOpen(false)}
      >
        <span className="site-nav-link__icon">
          <i className={`bi ${iconClass}`} aria-hidden />
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-lg site-navbar sticky-top">
      <div className="container site-navbar__inner">
        <Link className="navbar-brand d-inline-flex align-items-center gap-2" to="/">
          <span className="brand-mark">
            <i className="bi bi-lightning-charge-fill" aria-hidden />
          </span>
          <span>ElectroStore</span>
        </Link>

        <button
          className={`navbar-toggler site-navbar__toggler${navOpen ? ' is-open' : ''}`}
          type="button"
          aria-controls="mainNav"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <span className="site-navbar__toggler-bar" />
          <span className="site-navbar__toggler-bar" />
          <span className="site-navbar__toggler-bar" />
        </button>

        <div className={`collapse navbar-collapse site-navbar__collapse${navOpen ? ' show' : ''}`} id="mainNav">
          <ul className="navbar-nav site-nav-main ms-lg-auto">
            {navLink('/', 'Shop', 'bi-grid-1x2-fill')}
            {navLink('/cart', 'Cart', 'bi-cart3')}
            {isAuthenticated && navLink('/orders', 'Orders', 'bi-receipt', ordersActive)}
            {isAuthenticated && navLink('/wishlist', 'Wishlist', 'bi-heart')}
          </ul>

          <div className="site-nav-actions">
            {hasStaffAccess ? (
              <div className={`nav-dropdown${staffOpen ? ' is-open' : ''}`} ref={staffRef}>
                <button
                  type="button"
                  className={`nav-dropdown__trigger site-nav-link${staffActive ? ' active' : ''}`}
                  onClick={() => setStaffOpen((prev) => !prev)}
                  aria-expanded={staffOpen}
                  aria-haspopup="menu"
                >
                  <span className="site-nav-link__icon site-nav-link__icon--admin">
                    <i className="bi bi-sliders" aria-hidden />
                  </span>
                  <span>Staff</span>
                  <i className={`bi bi-chevron-${staffOpen ? 'up' : 'down'} nav-dropdown__chevron`} aria-hidden />
                </button>
                {staffOpen ? (
                  <div className="nav-dropdown__panel nav-dropdown__panel--admin" role="menu">
                    <div className="nav-dropdown__title">Operations</div>
                    {staffLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`nav-dropdown__item${pathname === link.match ? ' is-active' : ''}`}
                        role="menuitem"
                        onClick={() => {
                          setStaffOpen(false);
                          setNavOpen(false);
                        }}
                      >
                        <i className={`bi ${link.icon}`} aria-hidden />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <ul className="navbar-nav site-nav-auth">
                {navLink('/login', 'Login', 'bi-box-arrow-in-right')}
                <li className="nav-item">
                  <Link
                    className="btn btn-primary btn-sm site-nav-register"
                    to="/register"
                    onClick={() => setNavOpen(false)}
                  >
                    <i className="bi bi-person-plus me-1" aria-hidden />
                    Register
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
