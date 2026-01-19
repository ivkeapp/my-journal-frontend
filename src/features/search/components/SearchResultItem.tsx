/**
 * Search Result Item
 * Displays a single search result with title, snippet, and score
 */

import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '../types';

interface SearchResultItemProps {
  result: SearchResult;
  className?: string;
}

export function SearchResultItem({ result, className }: SearchResultItemProps) {
  // Calculate visual score (normalize to 0-100%)
  const normalizedScore = Math.min(Math.max(result._searchScore * 20, 10), 100);

  return (
    <Link
      to={`/journal/${result.id}`}
      className={cn(
        'block p-5 bg-white',
        'border border-gray-100 rounded-xl',
        'hover:border-gray-200 hover:shadow-sm',
        'transition-all duration-150',
        'group',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700 mb-1 line-clamp-1">
            {result.title || 'Untitled'}
          </h3>

          {/* Snippet */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {result._searchSnippet}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4">
            {/* Relevance bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Relevance</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all"
                  style={{ width: `${normalizedScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default SearchResultItem;
