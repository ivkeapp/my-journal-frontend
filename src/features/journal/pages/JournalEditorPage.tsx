/**
 * Journal Editor Page
 * Handles both new entries and editing existing entries/drafts
 * Implements autosave, optimistic updates, and proper status handling
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useJournalEntry,
  useAutosave,
  usePublishDraft,
  useDeleteEntry,
  useDeleteDraft,
  useSaveDraft,
} from '../hooks';
import { JournalEditor, EntryToolbar, EntryStatusIndicator } from '../components';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { EntryStatus } from '../types';

export function JournalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;
  const entryId = isNew ? null : parseInt(id!, 10);

  // Fetch existing entry if editing
  const { data: existingEntry, isLoading: isLoadingEntry, error: loadError } = useJournalEntry(entryId);

  // Local editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('draft');
  const [currentId, setCurrentId] = useState<number | null>(entryId);
  const [isDataInitialized, setIsDataInitialized] = useState(isNew);

  // Mutations
  const publishDraft = usePublishDraft();
  const deleteEntry = useDeleteEntry();
  const deleteDraft = useDeleteDraft();
  const saveDraft = useSaveDraft();

  // Initialize editor state from fetched entry
  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content || '');
      setEntryStatus(existingEntry.status);
      setCurrentId(existingEntry.id);
      setIsDataInitialized(true);
    }
  }, [existingEntry]);

  // Handle new draft creation - update URL
  const handleCreated = useCallback((newId: number) => {
    setCurrentId(newId);
    // Update URL without full navigation to avoid re-mounting
    window.history.replaceState(null, '', `/journal/${newId}`);
  }, []);

  // Autosave hook - now returns status internally
  const { saveNow, saveStatus, lastSavedAt, isSaving, isDirty } = useAutosave({
    id: currentId,
    title,
    content,
    status: entryStatus,
    debounceMs: 1000,
    onCreated: handleCreated,
    enabled: true,
    isInitialized: isDataInitialized,
  });

  // Handle manual save
  const handleSave = useCallback(async () => {
    await saveNow();
  }, [saveNow]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!currentId) {
      // Need to save first to get an ID
      if (!title.trim() && !content.trim()) {
        toast.error('Cannot publish empty entry');
        return;
      }

      try {
        // Create draft first
        const result = await saveDraft.mutateAsync({
          title: title.trim() || 'Untitled',
          content,
        });
        
        // Then publish it
        await publishDraft.mutateAsync(result.draft.id);
        toast.success('Entry published!');
        navigate('/journal');
      } catch (error) {
        toast.error('Failed to publish');
        console.error('Publish error:', error);
      }
      return;
    }

    try {
      // Save any pending changes first
      if (isDirty) {
        await saveNow();
      }
      
      await publishDraft.mutateAsync(currentId);
      setEntryStatus('published');
      toast.success('Entry published!');
      navigate('/journal');
    } catch (error) {
      toast.error('Failed to publish');
      console.error('Publish error:', error);
    }
  }, [currentId, title, content, isDirty, saveNow, saveDraft, publishDraft, navigate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      entryStatus === 'draft'
        ? 'Delete this draft? This cannot be undone.'
        : 'Delete this entry? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      if (currentId) {
        if (entryStatus === 'draft') {
          await deleteDraft.mutateAsync(currentId);
          toast.success('Draft deleted');
          navigate('/drafts');
        } else {
          await deleteEntry.mutateAsync(currentId);
          toast.success('Entry deleted');
          navigate('/journal');
        }
      } else {
        // New unsaved entry, just navigate away
        navigate('/journal');
      }
    } catch (error) {
      toast.error('Failed to delete');
      console.error('Delete error:', error);
    }
  }, [currentId, entryStatus, deleteDraft, deleteEntry, navigate]);

  // Loading state for existing entry
  if (!isNew && isLoadingEntry) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (only for existing entries, not new)
  if (!isNew && loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load entry. It may have been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canPublish = entryStatus === 'draft' && (title.trim() !== '' || content.trim() !== '');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Toolbar */}
      <EntryToolbar
        entryStatus={entryStatus}
        isDirty={isDirty}
        isSaving={isSaving}
        isPublishing={publishDraft.isPending}
        isDeleting={deleteEntry.isPending || deleteDraft.isPending}
        onSave={handleSave}
        onPublish={handlePublish}
        onDelete={handleDelete}
        canPublish={canPublish}
      />

      {/* Status bar */}
      <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <EntryStatusIndicator
            saveStatus={saveStatus}
            entryStatus={entryStatus}
            lastSavedAt={lastSavedAt}
          />
        </div>
      </div>

      {/* Editor */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <JournalEditor
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          disabled={publishDraft.isPending || deleteEntry.isPending || deleteDraft.isPending}
        />
      </main>
    </div>
  );
}

export default JournalEditorPage;
