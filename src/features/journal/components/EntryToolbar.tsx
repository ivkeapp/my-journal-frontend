/**
 * Entry Toolbar
 * Minimal toolbar with Save/Publish, Delete, Back actions
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Send, Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { EntryStatus } from '../types';

interface EntryToolbarProps {
  entryStatus: EntryStatus;
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDelete: () => void;
  canPublish: boolean;
}

export function EntryToolbar({
  entryStatus,
  isDirty,
  isSaving,
  isPublishing,
  isDeleting,
  onSave,
  onPublish,
  onDelete,
  canPublish,
}: EntryToolbarProps) {
  const navigate = useNavigate();
  const isProcessing = isSaving || isPublishing || isDeleting;

  const handleBack = () => {
    if (entryStatus === 'draft') {
      navigate('/drafts');
    } else {
      navigate('/journal');
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10">
      {/* Left: Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        disabled={isProcessing}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </Button>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isProcessing}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isDeleting ? (
            <Spinner size="sm" className="text-red-600" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-2">Delete</span>
        </Button>

        {/* Save button - always available, enabled when dirty */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isProcessing || !isDirty}
          className="gap-2"
        >
          {isSaving ? (
            <Spinner size="sm" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Save</span>
        </Button>

        {/* Publish button (for drafts) */}
        {entryStatus === 'draft' && (
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isProcessing || !canPublish}
            className="gap-2"
          >
            {isPublishing ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

export default EntryToolbar;
