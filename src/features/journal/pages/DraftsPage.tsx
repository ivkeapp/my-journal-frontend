/**
 * Drafts Page
 * Displays all draft entries
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useDrafts, useJournalCounts } from '../hooks';
import { EntryList } from '../components';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Plus, FileEdit, LogOut } from 'lucide-react';

export function DraftsPage() {
  const { user, logout } = useAuth();
  const { data, isLoading, error } = useDrafts();
  const { data: countsData } = useJournalCounts();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">My Journal</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {user?.username || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <Link
              to="/journal"
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
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
              className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm"
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
                  Failed to load drafts. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {data && (
            <EntryList
              entries={data.drafts}
              emptyMessage="No drafts. Start writing something new!"
              emptyIcon={<FileEdit className="h-12 w-12 mb-4" />}
              basePath="/journal"
            />
          )}
        </div>

        {/* Pagination hint */}
        {data && data.totalPages > 1 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Showing {data.drafts.length} of {data.total} drafts
          </p>
        )}
      </main>
    </div>
  );
}

export default DraftsPage;
