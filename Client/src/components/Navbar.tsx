import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt, FaSearch } from 'react-icons/fa';
import UserIcon from './UserIcon';
import ThemeSelector from './ThemeSelector';
import NotificationDropdown from './NotificationDropdown';

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

  // ✅ NAVIGATION - Ne pas afficher la navbar sur les pages d'authentification
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  if (isAuthPage) return null;

  const getFullImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const profilePictureUrl = user?.profile_picture_url
    ? getFullImageUrl(user.profile_picture_url)
    : undefined;

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
        <ThemeSelector compact className="nav-theme-selector" />
        {isAuthenticated && user && (
          <>
            <Link to="/browse" className="nav-link">
              <FaSearch style={{ marginRight: '8px' }} />
              Browse
            </Link>
            {/* ✅ NOTIFICATIONS EN TEMPS RÉEL - Visible depuis toutes les pages */}
            <NotificationDropdown
              onViewProfile={(userId) => navigate(`/user/${userId}`)}
              onOpenChat={(conversationId) => {
                // This will be handled by the ChatWidget component
                console.log('Open chat for conversation:', conversationId);
              }}
            />
            <Link to="/profile" className="nav-username">
              <UserIcon
                profilePictureUrl={profilePictureUrl}
                username={user.username}
                className="nav-profile-picture"
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
