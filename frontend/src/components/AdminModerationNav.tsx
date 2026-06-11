import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

type Tab = 'reviews' | 'orders' | 'products' | 'pricing' | 'returns';

export const AdminModerationNav = ({ active }: { active: Tab }): JSX.Element => {
  const { user } = useAuth();
  const isProductManager = user?.role === 'product_manager';
  const isSalesManager = user?.role === 'sales_manager';

  const btn = (to: string, tab: Tab, label: string, shortLabel: string, icon: string) => (
    <Link
      key={tab}
      to={to}
      className={`admin-nav__link${active === tab ? ' is-active' : ''}`}
      title={label}
    >
      <span className="admin-nav__icon">
        <i className={`bi ${icon}`} aria-hidden />
      </span>
      <span className="admin-nav__label">{label}</span>
      <span className="admin-nav__label-short">{shortLabel}</span>
    </Link>
  );

  return (
    <div className="admin-nav-scroll">
      <nav className="admin-nav" aria-label="Staff sections">
        {isProductManager && btn('/admin/orders', 'orders', 'Deliveries', 'Deliveries', 'bi-truck')}
        {isProductManager && btn('/admin/products', 'products', 'Catalog', 'Catalog', 'bi-box-seam')}
        {isSalesManager && btn('/admin/pricing', 'pricing', 'Pricing & sales', 'Pricing', 'bi-currency-exchange')}
        {isSalesManager && btn('/admin/returns', 'returns', 'Returns', 'Returns', 'bi-arrow-counterclockwise')}
        {isProductManager && btn('/admin/reviews', 'reviews', 'Customer reviews', 'Reviews', 'bi-chat-square-text')}
      </nav>
    </div>
  );
};
