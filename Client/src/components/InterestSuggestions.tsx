import React from 'react';
import { FaPlus, FaSearch, FaTags } from 'react-icons/fa';
import { Interest } from '../services/interestService';

interface InterestSuggestionsProps {
  suggestions: Interest[];
  isLoading: boolean;
  query: string;
  onSelectInterest: (interest: Interest) => void;
  onCreateInterest: (name: string) => void;
  userInterestIds: number[];
  isVisible: boolean;
}

const InterestSuggestions: React.FC<InterestSuggestionsProps> = ({
  suggestions,
  isLoading,
  query,
  onSelectInterest,
  onCreateInterest,
  userInterestIds,
  isVisible,
}) => {
  if (!isVisible) return null;

  const trimmedQuery = query.trim();
  const filteredSuggestions = suggestions.filter(
    interest => !userInterestIds.includes(interest.id)
  );

  const exactMatch = filteredSuggestions.find(
    interest => interest.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const showCreateOption = trimmedQuery.length >= 2 && !exactMatch;

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => (
      regex.test(part) ? (
        <span key={index} className="highlight">{part}</span>
      ) : (
        part
      )
    ));
  };

  if (isLoading) {
    return (
      <div className="interest-suggestions">
        <div className="suggestions-loading">
          <FaSearch className="spinning" />
          <span>Searching interests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="interest-suggestions">
      {filteredSuggestions.length === 0 && !showCreateOption ? (
        <div className="suggestions-empty">
          {trimmedQuery ? (
            <>
              <FaSearch />
              <span>No interests found for "{trimmedQuery}"</span>
            </>
          ) : (
            <>
              <FaTags />
              <span>Start typing to search interests...</span>
            </>
          )}
        </div>
      ) : (
        <>
          {showCreateOption && (
            <div
              className="suggestion-item create-new"
              onClick={() => onCreateInterest(trimmedQuery)}
            >
              <FaPlus className="suggestion-icon" />
              <span className="suggestion-text">
                Create "<strong>{trimmedQuery}</strong>"
              </span>
            </div>
          )}

          {filteredSuggestions.slice(0, 8).map((interest) => (
            <div
              key={interest.id}
              className="suggestion-item"
              onClick={() => onSelectInterest(interest)}
            >
              <span className="suggestion-tag">#{interest.tag}</span>
              <span className="suggestion-name">
                {highlightText(interest.name, trimmedQuery)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default InterestSuggestions;
