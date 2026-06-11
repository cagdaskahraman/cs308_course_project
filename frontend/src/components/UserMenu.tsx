import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const roleLabel = (role: string | undefined): string => {
  switch (role) {
    case 'product_manager':
      return 'Product manager';
    case 'sales_manager':
      return 'Sales manager';
    default:
      return 'Customer';
  }
};

export const UserMenu = (): JSX.Element | null => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user.email.split('@')[0];
  const handleLogout = () => {
    setOpen(false);
    signOut();
    navigate('/');
  };

  return (
    <div className={`user-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="user-menu__avatar" aria-hidden>
          <i className="bi bi-person-fill" />
        </span>
        <span className="user-menu__label">
          <span className="user-menu__name">{displayName}</span>
          <span className="user-menu__role">{roleLabel(user.role)}</span>
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} user-menu__chevron`} aria-hidden />
      </button>
      {open ? (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__header">
            <span className="user-menu__avatar user-menu__avatar--lg" aria-hidden>
              <i className="bi bi-person-fill" />
            </span>
            <div>
              <div className="user-menu__header-name">{displayName}</div>
              <div className="user-menu__header-email">{user.email}</div>
            </div>
          </div>
          <div className="user-menu__section">
            <Link
              to="/profile"
              className="user-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-person-badge" aria-hidden />
              Profile
            </Link>
            <Link
              to="/orders"
              className="user-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-receipt" aria-hidden />
              My orders
            </Link>
            <Link
              to="/wishlist"
              className="user-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-heart" aria-hidden />
              Wishlist
            </Link>
          </div>
          <div className="user-menu__section">
            <button
              type="button"
              className="user-menu__item user-menu__item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
