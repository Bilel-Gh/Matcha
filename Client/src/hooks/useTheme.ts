import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'romantic';
  });

  useEffect(() => {
    // Ensure theme is applied to document
    const applyTheme = (theme: string) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    };

    // Apply current theme
    applyTheme(currentTheme);

    // Listen for theme changes from other components
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme;
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    };

    // Listen for storage changes (theme changes from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue && e.newValue !== currentTheme) {
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
            localStorage.setItem('theme', newTheme);
          }
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Add event listeners
    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentTheme]);

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  };

  return {
    currentTheme,
    changeTheme
  };
};

export default useTheme;
