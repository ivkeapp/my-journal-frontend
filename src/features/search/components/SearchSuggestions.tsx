/**
 * Search Suggestions Dropdown
 * Shows live search results as user types
 */

import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult, SearchState } from '../types';

interface SearchSuggestionsProps {
  suggestions: SearchResult[];
  state: SearchState;
  isVisible: boolean;
  onSelect: (result: SearchResult) => void;
  className?: string;
}

export function SearchSuggestions({
  suggestions,
  state,
  isVisible,
  onSelect,
  className,
}: SearchSuggestionsProps) {
  if (!isVisible) {
    return null;
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
  };

  // Truncate snippet to reasonable length
  const truncateSnippet = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 z-50',
        'bg-white border border-gray-200 rounded-xl shadow-lg',
        'overflow-hidden',
        className
      )}
    >
      {/* Loading state */}
      {state === 'loading' && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm">Search failed</span>
        </div>
      )}

      {/* Empty state */}
      {state === 'success' && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <span className="text-sm">No results found</span>
        </div>
      )}

      {/* Results */}
      {state === 'success' && suggestions.length > 0 && (
        <ul className="py-2">
          {suggestions.map((result, index) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className={cn(
                  'w-full px-4 py-3 text-left',
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
                  {/* Subtle relevance indicator */}
                  <div
                    className="w-1 h-6 rounded-full bg-gray-200 flex-shrink-0"
                    style={{
                      opacity: Math.min(0.3 + result._searchScore * 0.15, 1),
                    }}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Keyboard hint */}
      {state === 'success' && suggestions.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">Enter</kbd> for full results
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchSuggestions;
