import React from "react";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import "../Styles/layout.css";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container py-4 flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
