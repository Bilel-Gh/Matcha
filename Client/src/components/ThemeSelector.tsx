import React, { useState, useEffect } from 'react';
import { FaPalette, FaCheck } from 'react-icons/fa';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Romantic Sunset',
    description: 'Couleurs douces et romantiques',
    preview: {
      primary: '#FF6B9D',
      secondary: '#FF8A80',
      accent: '#FFC107'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Fraîcheur marine et sérénité',
    preview: {
      primary: '#26C6DA',
      secondary: '#42A5F5',
      accent: '#66BB6A'
    }
  },
  {
    id: 'lavender',
    name: 'Lavender Dreams',
    description: 'Élégance violette et mystère',
    preview: {
      primary: '#9C27B0',
      secondary: '#BA68C8',
      accent: '#7986CB'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Nature et harmonie',
    preview: {
      primary: '#4CAF50',
      secondary: '#8BC34A',
      accent: '#FF7043'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Mode sombre élégant',
    preview: {
      primary: '#BB86FC',
      secondary: '#03DAC6',
      accent: '#FF6E40'
    }
  }
];

interface ThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  compact = false
}) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('matcha-theme') || 'default';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const body = document.body;

    // Remove all theme classes
    themes.forEach(theme => {
      body.removeAttribute('data-theme');
    });

    // Apply new theme
    if (themeId !== 'default') {
      body.setAttribute('data-theme', themeId);
    }

    // Save to localStorage
    localStorage.setItem('matcha-theme', themeId);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    setIsOpen(false);
  };

  const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];

  if (compact) {
    return (
      <div className={`theme-selector-compact ${className}`}>
        <button
          className="theme-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Changer de thème"
        >
          <FaPalette />
        </button>

        {isOpen && (
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
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="color-dot"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="color-dot"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
                <span className="theme-name">{theme.name}</span>
                {currentTheme === theme.id && <FaCheck className="check-icon" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`theme-selector ${className}`}>
      <div className="theme-selector-header">
        <h3>
          <FaPalette style={{ marginRight: '8px' }} />
          Thème de l'interface
        </h3>
        <p>Personnalisez l'apparence de Matcha selon vos préférences</p>
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
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <div
                  className="color-secondary"
                  style={{ backgroundColor: theme.preview.secondary }}
                />
                <div
                  className="color-accent"
                  style={{ backgroundColor: theme.preview.accent }}
                />
              </div>
              {currentTheme === theme.id && (
                <div className="selected-indicator">
                  <FaCheck />
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
