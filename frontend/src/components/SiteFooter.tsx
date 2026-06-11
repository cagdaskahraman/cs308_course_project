export const SiteFooter = (): JSX.Element => (
  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__grid">
        <div>
          <div className="site-footer__brand">
            <i className="bi bi-lightning-charge-fill" aria-hidden />
            <span>ElectroStore</span>
          </div>
          <p className="site-footer__text">
            Premium electronics with secure checkout, live stock, and fast delivery tracking.
          </p>
        </div>
        <div>
          <h6 className="site-footer__heading">Shop</h6>
          <ul className="site-footer__links">
            <li><a href="/">Catalog</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="/orders">Orders</a></li>
          </ul>
        </div>
        <div>
          <h6 className="site-footer__heading">Account</h6>
          <ul className="site-footer__links">
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
            <li><a href="/profile">Profile</a></li>
          </ul>
        </div>
        <div>
          <h6 className="site-footer__heading">Support</h6>
          <ul className="site-footer__links">
            <li>Secure card payments</li>
            <li>Digital invoices</li>
            <li>30-day returns</li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} ElectroStore. All rights reserved.</span>
      </div>
    </div>
  </footer>
);
