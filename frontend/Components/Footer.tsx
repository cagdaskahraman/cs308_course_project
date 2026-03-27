import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container">
        <div className="row g-3">
          <div className="col-md-4">
            <h6 className="text-uppercase mb-2">ElectroStore</h6>
            <p className="small text-secondary mb-0">
              Your trusted electronics partner for daily tech needs.
            </p>
          </div>

          <div className="col-md-4">
            <h6 className="text-uppercase mb-2">Quick Links</h6>
            <ul className="list-unstyled small mb-0">
              <li>
                <a className="text-decoration-none text-secondary" href="/about">
                  About
                </a>
              </li>
              <li>
                <a className="text-decoration-none text-secondary" href="/contact">
                  Contact
                </a>
              </li>
              <li>
                <a className="text-decoration-none text-secondary" href="/support">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="text-uppercase mb-2">Follow Us</h6>
            <div className="d-flex gap-3 small">
              <a className="text-decoration-none text-secondary" href="#!">
                Instagram
              </a>
              <a className="text-decoration-none text-secondary" href="#!">
                X
              </a>
              <a className="text-decoration-none text-secondary" href="#!">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <hr className="border-secondary my-3" />

        <p className="small text-center text-secondary mb-0">
          &copy; {new Date().getFullYear()} ElectroStore. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
