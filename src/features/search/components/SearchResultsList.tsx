/**
 * Search Results List
 * Displays a list of search results with loading/empty/error states
 */

import type { SearchResult } from '../types';
import { SearchResultItem } from './SearchResultItem';
import { FileSearch, AlertCircle, Search } from 'lucide-react';

interface SearchResultsListProps {
  results: SearchResult[];
  state: 'idle' | 'loading' | 'success' | 'error';
  error?: Error | null;
  query: string;
}

export function SearchResultsList({
  results,
  state,
  error,
  query,
}: SearchResultsListProps) {
  // Idle state - no search performed yet
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Search your journal
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Type a query to search through your journal entries. Results will
          appear as you type.
        </p>
      </div>
    );
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Searching...</p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Search failed
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {error?.message || 'An error occurred while searching. Please try again.'}
        </p>
      </div>
    );
  }

  // Empty state - no results
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileSearch className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No results found
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          No entries match "{query}". Try different keywords or check your
          spelling.
        </p>
      </div>
    );
  }

  // Results list
  return (
    <div className="space-y-3">
      {/* Results header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <p className="text-sm text-gray-500">
          Found <span className="font-medium text-gray-700">{results.length}</span>{' '}
          {results.length === 1 ? 'result' : 'results'} for "{query}"
        </p>
      </div>

      {/* Results */}
      {results.map((result) => (
        <SearchResultItem key={result.id} result={result} />
      ))}
    </div>
  );
}

export default SearchResultsList;
