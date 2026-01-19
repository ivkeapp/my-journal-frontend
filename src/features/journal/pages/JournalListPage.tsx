/**
 * Journal List Page
 * Displays published journal entries
 */

import { Link } from 'react-router-dom';
import { useJournalEntries, useJournalCounts } from '../hooks';
import { EntryList } from '../components';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppHeader } from '@/components/layout';
import { Plus, FileEdit } from 'lucide-react';

export function JournalListPage() {
  const { data, isLoading, error } = useJournalEntries();
  const { data: countsData } = useJournalCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <Link
              to="/journal"
              className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm"
            >
              Published
              {countsData?.counts.published ? (
                <span className="ml-2 text-gray-400">
                  {countsData.counts.published}
                </span>
              ) : null}
            </Link>
            <Link
              to="/drafts"
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
            >
              <FileEdit className="w-4 h-4 inline mr-1" />
              Drafts
              {countsData?.counts.drafts ? (
                <span className="ml-2 text-amber-600">
                  {countsData.counts.drafts}
                </span>
              ) : null}
            </Link>
          </div>

          <Link to="/journal/new">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Entry</span>
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load entries. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {data && (
            <EntryList
              entries={data.entries}
              emptyMessage="No entries yet. Start writing!"
              basePath="/journal"
            />
          )}
        </div>

        {/* Pagination hint */}
        {data && data.totalPages > 1 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Showing {data.entries.length} of {data.total} entries
          </p>
        )}
      </main>
    </div>
  );
}

export default JournalListPage;
