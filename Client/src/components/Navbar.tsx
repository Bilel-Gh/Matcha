import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt } from 'react-icons/fa';
import UserIcon from './UserIcon';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, refreshUser, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh user info when component mounts to get latest profile picture
  React.useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token]);

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
        {isAuthenticated && user && (
          <>
                                    <Link to="/profile" className="nav-username">
              <UserIcon
                profilePictureUrl={user.profile_picture_url}
                username={user.username}
              />
              {user.username}
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
