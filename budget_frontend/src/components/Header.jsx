import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('userId')));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('userId')));
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  // If on auth pages, don't show header
  if (isAuthPage) {
    return null;
  }

  return (
    <header className="header">
      <Link to="/" className="logo">Xpenso</Link> 
      
      <nav className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
        <Link to="/accounts" className={location.pathname === '/accounts' ? 'active' : ''}>Accounts</Link>
        <Link to="/transactions" className={location.pathname === '/transactions' ? 'active' : ''}>Transactions</Link>
        <Link to="/budgets" className={location.pathname === '/budgets' ? 'active' : ''}>Budgets</Link>
        <Link to="/goals" className={location.pathname === '/goals' ? 'active' : ''}>Goals</Link>
        <Link to="/categories" className={location.pathname === '/categories' ? 'active' : ''}>Categories</Link>
        <Link to="/tags" className={location.pathname === '/tags' ? 'active' : ''}>Tags</Link>
        <Link to="/savings-accounts" className={location.pathname === '/savings-accounts' ? 'active' : ''}>Savings</Link>
      </nav>
      
      <div className="auth-buttons">
        {isLoggedIn ? (
          <button type="button" className="btn btn-secondary btn-logout" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-login">Log In</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
