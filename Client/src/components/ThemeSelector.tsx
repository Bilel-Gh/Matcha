import React, { useState, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';

interface Theme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const themes: Theme[] = [
  {
    id: 'romantic',
    name: 'Romantic Sunset',
    description: 'Warm and passionate tones',
    primaryColor: '#fd297b',
    secondaryColor: '#ff8a00',
    accentColor: '#ffb347'
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Cool and refreshing blues',
    primaryColor: '#2196F3',
    secondaryColor: '#00BCD4',
    accentColor: '#4FC3F7'
  },
  {
    id: 'lavender',
    name: 'Lavender Dreams',
    description: 'Soft and elegant purples',
    primaryColor: '#9C27B0',
    secondaryColor: '#673AB7',
    accentColor: '#BA68C8'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and earthy greens',
    primaryColor: '#4CAF50',
    secondaryColor: '#8BC34A',
    accentColor: '#81C784'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and sophisticated',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#a855f7'
  }
];

interface ThemeSelectorProps {
  compact?: boolean;
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false, className = '' }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'romantic';
  });
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync with theme changes from other sources
  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const documentTheme = document.documentElement.getAttribute('data-theme');
      const activeTheme = savedTheme || documentTheme || 'romantic';

      if (activeTheme !== currentTheme) {
        setCurrentTheme(activeTheme);
      }
    };

    // Listen for storage changes (theme changes from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setCurrentTheme(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    // Listen for attribute changes on document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          if (newTheme && newTheme !== currentTheme) {
            setCurrentTheme(newTheme);
          }
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);

    // Initial sync
    syncTheme();

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentTheme]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('theme', themeId);
    setShowDropdown(false);

    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeId } }));
  };

  if (compact) {
    return (
      <div className={`theme-selector-compact ${className}`}>
        <button
          className="theme-toggle-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          title="Change theme"
        >
          <FaPalette />
        </button>

        {showDropdown && (
          <div className="theme-dropdown">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className="theme-preview-mini">
                  <div
                    className="color-dot"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div
                    className="color-dot"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <div
                    className="color-dot"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                <span className="theme-name">{theme.name}</span>
                {currentTheme === theme.id && (
                  <span className="check-icon">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Backdrop to close dropdown */}
        {showDropdown && (
          <div
            className="dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="theme-selector">
      <div className="theme-selector-header">
        <h3>Choose Your Theme</h3>
        <p>Personalize your experience with beautiful color schemes</p>
      </div>

      <div className="themes-grid">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
          >
            <div className="theme-preview">
              <div className="preview-colors">
                <div
                  className="color-primary"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div
                  className="color-secondary"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
                <div
                  className="color-accent"
                  style={{ backgroundColor: theme.accentColor }}
                />
              </div>
              {currentTheme === theme.id && (
                <div className="selected-indicator">
                  ✓
                </div>
              )}
            </div>

            <div className="theme-info">
              <h4>{theme.name}</h4>
              <p>{theme.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
