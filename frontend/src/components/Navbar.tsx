import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export const Navbar = (): JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(to + '/');
  };

  const navLink = (to: string, label: string, extra?: JSX.Element) => (
    <li key={to}>
      <Link
        className={`es-navlink${isActive(to) ? ' es-navlink--active' : ''}`}
        to={to}
      >
        {label}
        {extra}
      </Link>
    </li>
  );

  const initial = user?.email?.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className={`es-nav${scrolled ? ' es-nav--scrolled' : ''}`}>
      <div className="es-nav__inner">
        <Link to="/" className="es-brand" aria-label="ElectroStore home">
          <span className="es-brand__mark">E</span>
          <span>ElectroStore</span>
        </Link>

        <button
          type="button"
          className="es-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>

        <ul className={`es-nav__links${open ? ' es-nav__links--open' : ''}`}>
          {navLink('/', 'Catalog')}
          {navLink(
            '/cart',
            'Cart',
            <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
              <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 8H6"/>
            </svg>,
          )}
          {user?.role === 'product_manager' && navLink('/admin/reviews', 'Moderation')}
          {isAuthenticated ? (
            <>
              <li>
                <span className="es-user-pill" title={user?.email}>
                  <span className="es-user-pill__avatar">{initial}</span>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </span>
                </span>
              </li>
              <li>
                <button type="button" className="es-btn es-btn--outline es-btn--sm" onClick={handleLogout}>
                  <svg className="es-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 17l5-5-5-5"/><path d="M20 12H9"/><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/>
                  </svg>
                  Log out
                </button>
              </li>
            </>
          ) : (
            <>
              {navLink('/login', 'Sign in')}
              <li>
                <Link to="/register" className="es-btn es-btn--primary es-btn--sm">
                  Create account
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
};
