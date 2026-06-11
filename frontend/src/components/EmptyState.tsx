import { Link } from 'react-router-dom';

type EmptyStateProps = {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
};

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps): JSX.Element => (
  <div className="state-panel state-panel--empty">
    <i className={`bi ${icon} state-panel__icon`} aria-hidden />
    <h3 className="state-panel__title">{title}</h3>
    {description ? <p className="state-panel__text">{description}</p> : null}
    {actionLabel && actionTo ? (
      <Link to={actionTo} className="btn btn-primary btn-lg mt-2">
        {actionLabel}
      </Link>
    ) : null}
  </div>
);
