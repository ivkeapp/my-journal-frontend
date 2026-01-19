/**
 * Search Page
 * Main search interface with input, suggestions, and results
 */

import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks';
import {
  SearchInput,
  SearchSuggestions,
  SearchResultsList,
} from '../components';
import type { SearchResult } from '../types';

export function SearchPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    suggestionsState,
    showSuggestions,
    results,
    resultsState,
    submitSearch,
    clearSearch,
    closeSuggestions,
  } = useSearch();

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeSuggestions();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSuggestions]);

  // Handle suggestion click
  const handleSuggestionClick = (result: SearchResult) => {
    navigate(`/journal/${result.id}`);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero search section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Search
            </h1>
            <p className="text-gray-500">
              Find entries by title, content, or keywords
            </p>
          </div>

          {/* Search input with suggestions */}
          <div ref={containerRef} className="relative">
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={setQuery}
              onSubmit={submitSearch}
              onClear={clearSearch}
              onEscape={closeSuggestions}
              isLoading={suggestionsState === 'loading'}
              placeholder="Type to search..."
            />

            {/* Suggestions dropdown */}
            <SearchSuggestions
              suggestions={suggestions}
              state={suggestionsState}
              isVisible={showSuggestions}
              onSelect={handleSuggestionClick}
            />
          </div>

          {/* Keyboard hint */}
          <div className="flex justify-center mt-4">
            <span className="text-xs text-gray-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">
                ⌘K
              </kbd>{' '}
              to focus search
            </span>
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SearchResultsList
          results={results}
          state={resultsState}
          query={query}
        />
      </div>
    </div>
  );
}

export default SearchPage;
