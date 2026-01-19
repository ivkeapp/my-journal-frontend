/**
 * App Header with integrated search
 * Shared across all authenticated pages
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useSearch } from '@/features/search';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, Search, X, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/features/search';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    suggestionsState,
    showSuggestions,
    clearSearch,
    closeSuggestions,
  } = useSearch({ suggestionsLimit: 5 });

  const handleLogout = async () => {
    await logout();
  };

  // Open search and focus input
  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Close search
  const closeSearch = () => {
    setIsSearchOpen(false);
    clearSearch();
    closeSuggestions();
  };

  // Handle suggestion click
  const handleSuggestionClick = (result: SearchResult) => {
    navigate(`/journal/${result.id}`);
    closeSearch();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (isSearchOpen) {
          inputRef.current?.focus();
        } else {
          openSearch();
        }
      }
      // Escape to close
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        clearSearch();
        closeSuggestions();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, clearSearch, closeSuggestions]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        closeSuggestions();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSuggestions]);

  // Truncate snippet
  const truncateSnippet = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/journal" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 hidden sm:inline">My Journal</span>
          </Link>

          {/* Search area */}
          <div ref={searchContainerRef} className="flex-1 max-w-md relative">
            {isSearchOpen ? (
              <>
                {/* Expanded search input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {suggestionsState === 'loading' ? (
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entries..."
                    className={cn(
                      'w-full pl-9 pr-9 py-2 text-sm',
                      'bg-gray-50 border border-gray-200 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300',
                      'placeholder:text-gray-400'
                    )}
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {suggestionsState === 'loading' && (
                      <div className="flex items-center justify-center py-6 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Searching...</span>
                      </div>
                    )}

                    {suggestionsState === 'success' && suggestions.length === 0 && (
                      <div className="flex items-center justify-center py-6 text-gray-400">
                        <span className="text-sm">No results found</span>
                      </div>
                    )}

                    {suggestionsState === 'success' && suggestions.length > 0 && (
                      <ul className="py-1">
                        {suggestions.map((result, index) => (
                          <li key={result.id}>
                            <button
                              type="button"
                              onClick={() => handleSuggestionClick(result)}
                              className={cn(
                                'w-full px-4 py-2.5 text-left',
                                'hover:bg-gray-50 transition-colors',
                                'focus:outline-none focus:bg-gray-50',
                                index !== suggestions.length - 1 && 'border-b border-gray-100'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {result.title || 'Untitled'}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {truncateSnippet(result._searchSnippet)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Collapsed search button */
              <button
                type="button"
                onClick={openSearch}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                  'bg-gray-50 border border-gray-200 rounded-lg',
                  'text-gray-400 hover:text-gray-500 hover:border-gray-300',
                  'transition-colors'
                )}
              >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 rounded text-gray-500 hidden sm:inline">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* User actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-500 hidden md:inline">
              {user?.username || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
