type PageHeaderProps = {
  icon?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
};

export const PageHeader = ({
  icon,
  title,
  subtitle,
  badge,
  children,
}: PageHeaderProps): JSX.Element => (
  <div className="page-header mb-4">
    <div className="page-header__main">
      <div>
        <h1 className="page-header__title">
          {icon ? <i className={`bi ${icon}`} aria-hidden /> : null}
          <span>{title}</span>
        </h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {badge ? <span className="page-header__badge">{badge}</span> : null}
    </div>
    {children ? <div className="page-header__actions">{children}</div> : null}
  </div>
);
