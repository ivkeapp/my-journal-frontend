/**
 * Entry List Component
 * Displays a list of journal entries or drafts
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, Calendar } from 'lucide-react';
import type { JournalEntry } from '../types';

interface EntryListProps {
  entries: JournalEntry[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  basePath?: string;
  className?: string;
}

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  emptyIcon,
  basePath = '/journal',
  className,
}: EntryListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        {emptyIcon || <FileText className="h-12 w-12 mb-4" />}
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`${basePath}/${entry.id}`}
          className="block p-4 hover:bg-gray-50 transition-colors group"
        >
          <article>
            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700 mb-1">
              {entry.title || 'Untitled'}
            </h3>

            {/* Content preview */}
            <p className="text-gray-500 text-sm mb-2 line-clamp-2">
              {truncateContent(entry.content) || 'No content'}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(entry.updated_at)}
              </span>
              <span>{formatTime(entry.updated_at)}</span>
              {entry.status === 'draft' && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                  Draft
                </span>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

export default EntryList;
