import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="app-shell">
      <Header />
      <main className="content-area">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;