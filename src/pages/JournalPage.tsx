/**
 * Journal Page (Placeholder)
 * This is a placeholder page to demonstrate auth flow works
 * Will be properly implemented in a future task
 */

import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut } from 'lucide-react';

export function JournalPage() {
  const { user, logout, isLoading } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">My Journal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.username || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Journal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You are successfully authenticated as{' '}
              <strong>{user?.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This is a placeholder page. Journal functionality will be implemented in a future task.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default JournalPage;
