import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

type Tab = 'reviews' | 'users' | 'orders' | 'products' | 'pricing';

export const AdminModerationNav = ({ active }: { active: Tab }): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isProductManager = user?.role === 'product_manager' || isAdmin;
  const isSalesManager = user?.role === 'sales_manager' || isAdmin;

  const btn = (to: string, tab: Tab, label: string, icon: string) => (
    <Link
      key={tab}
      to={to}
      className={`btn btn-sm d-inline-flex align-items-center gap-2${
        active === tab ? ' btn-primary' : ' btn-outline-secondary'
      }`}
    >
      <i className={`bi ${icon}`} aria-hidden />
      {label}
    </Link>
  );

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
      {isProductManager && btn('/admin/orders', 'orders', 'Delivery queue', 'bi-truck')}
      {isProductManager && btn('/admin/products', 'products', 'Catalog management', 'bi-box-seam')}
      {isSalesManager && btn('/admin/pricing', 'pricing', 'Pricing & sales', 'bi-currency-exchange')}
      {isProductManager && btn('/admin/reviews', 'reviews', 'Review queue', 'bi-chat-square-text')}
      {isAdmin && btn('/admin/users', 'users', 'User management', 'bi-people-fill')}
    </div>
  );
};
