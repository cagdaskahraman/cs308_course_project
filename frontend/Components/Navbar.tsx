import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold" href="/">
          ElectroStore
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#globalNavbar"
          aria-controls="globalNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="globalNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/products">
                Products
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/deals">
                Deals
              </a>
            </li>
          </ul>

          <form className="d-flex me-3" role="search">
            <input
              className="form-control form-control-sm"
              type="search"
              placeholder="Search products"
              aria-label="Search products"
            />
          </form>

          <div className="d-flex gap-2">
            <a className="btn btn-outline-light btn-sm" href="/login">
              Login
            </a>
            <a className="btn btn-warning btn-sm" href="/cart">
              Cart
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
