import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Ne pas afficher la navbar sur les pages d'authentification
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  if (isAuthPage) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Matcha</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated && (
          <>
            <Link to="/profile" className="nav-link">
              <FaUser style={{ marginRight: '8px' }} />
              Profile
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              <FaSignOutAlt style={{ marginRight: '8px' }} />
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
