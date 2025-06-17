import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { Interest } from '../services/interestService';
import InterestSuggestions from './InterestSuggestions';

interface AddInterestInputProps {
  onAddInterest: (interest: Interest) => void;
  onCreateAndAddInterest: (name: string) => void;
  onSearch: (query: string) => void;
  suggestions: Interest[];
  isLoading: boolean;
  userInterestIds: number[];
  popularInterests: Interest[];
}

const AddInterestInput: React.FC<AddInterestInputProps> = ({
  onAddInterest,
  onCreateAndAddInterest,
  onSearch,
  suggestions,
  isLoading,
  userInterestIds,
  popularInterests,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSelectInterest = (interest: Interest) => {
    onAddInterest(interest);
    setQuery('');
    setShowSuggestions(false);
    // Keep input focused for multiple additions
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCreateInterest = (name: string) => {
    onCreateAndAddInterest(name);
    setQuery('');
    setShowSuggestions(false);
    // Keep input focused for multiple additions
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        // If there's an exact match, add it; otherwise create new
        const exactMatch = suggestions.find(
          interest =>
            interest.name.toLowerCase() === trimmedQuery.toLowerCase() &&
            !userInterestIds.includes(interest.id)
        );

        if (exactMatch) {
          handleSelectInterest(exactMatch);
        } else if (trimmedQuery.length >= 2) {
          handleCreateInterest(trimmedQuery);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const displaySuggestions = query.trim() ? suggestions : popularInterests;

  return (
    <div className="add-interest-container" ref={containerRef}>
      <div className="add-interest-input-wrapper">
        <div className={`add-interest-input ${isFocused ? 'focused' : ''}`}>
          <FaSearch className="input-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Add interests like #vegan, #gaming, #travel..."
            className="interest-search-input"
          />
          {query && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
        </div>

        {query.trim() && (
          <button
            type="button"
            className="add-btn"
            onClick={() => {
              const trimmedQuery = query.trim();
              if (trimmedQuery.length >= 2) {
                handleCreateInterest(trimmedQuery);
              }
            }}
            disabled={query.trim().length < 2}
          >
            <FaPlus />
          </button>
        )}
      </div>

      <InterestSuggestions
        suggestions={displaySuggestions}
        isLoading={isLoading}
        query={query}
        onSelectInterest={handleSelectInterest}
        onCreateInterest={handleCreateInterest}
        userInterestIds={userInterestIds}
        isVisible={showSuggestions && (isFocused || query.trim().length > 0)}
      />

      {!query && isFocused && popularInterests.length > 0 && (
        <div className="popular-interests-hint">
          <span>Popular interests:</span>
        </div>
      )}
    </div>
  );
};

export default AddInterestInput;
