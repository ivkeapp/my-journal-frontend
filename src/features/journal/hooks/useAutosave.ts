/**
 * Autosave Hook
 * Debounced autosave with proper cancellation and race condition handling
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useSaveDraft, useUpdateEntry } from './useJournal';
import type { SaveStatus, EntryStatus } from '../types';

interface AutosaveOptions {
  /** Entry ID (null for new entries) */
  id: number | null;
  /** Current title value */
  title: string;
  /** Current content value */
  content: string;
  /** Whether entry is draft or published */
  status: EntryStatus;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Callback when entry is created (returns new ID) */
  onCreated?: (id: number) => void;
  /** Whether autosave is enabled */
  enabled?: boolean;
  /** Whether the initial data has been loaded */
  isInitialized?: boolean;
}

interface AutosaveReturn {
  /** Trigger immediate save */
  saveNow: () => Promise<void>;
  /** Current save status */
  saveStatus: SaveStatus;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Whether currently saving */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
}

export function useAutosave({
  id,
  title,
  content,
  status,
  debounceMs = 1000,
  onCreated,
  enabled = true,
  isInitialized = false,
}: AutosaveOptions): AutosaveReturn {
  const saveDraft = useSaveDraft();
  const updateEntry = useUpdateEntry();
  
  // Internal state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Track the last saved values to detect changes
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ title: string; content: string } | null>(null);
  const currentIdRef = useRef<number | null>(id);
  const isSavingRef = useRef(false); // Lock to prevent concurrent saves
  
  // Keep track of current ID
  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  // Initialize lastSavedRef when data is first loaded
  useEffect(() => {
    if (isInitialized && lastSavedRef.current === null) {
      lastSavedRef.current = { title, content };
      // Don't show any status on initial load - status only matters after user edits
      // Keep status as 'idle' until user makes changes
    }
  }, [isInitialized, title, content]);

  // Check if there are unsaved changes
  const isDirty = 
    lastSavedRef.current !== null &&
    (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content);

  // For published entries, track unsaved status without autosaving
  useEffect(() => {
    if (!isInitialized || status !== 'published') return;
    
    if (isDirty) {
      setSaveStatus('unsaved');
    } else if (saveStatus === 'unsaved') {
      // Only reset to idle if we were in unsaved state (don't reset 'saved')
      setSaveStatus('idle');
    }
  }, [isDirty, isInitialized, status, saveStatus]);

  // Clear any pending timeout
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform the actual save
  const performSave = useCallback(async (saveTitle: string, saveContent: string) => {
    // Prevent concurrent saves (race condition that creates duplicate drafts)
    if (isSavingRef.current) {
      // Queue another save after current one finishes
      pendingSaveRef.current = { title: saveTitle, content: saveContent };
      return;
    }
    
    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const currentId = currentIdRef.current;
      
      if (status === 'draft') {
        // For drafts, use the draft endpoint
        const result = await saveDraft.mutateAsync({
          id: currentId ?? undefined,
          title: saveTitle,
          content: saveContent,
        });

        // If this was a new draft, notify parent of the new ID
        if (currentId === null && result.draft.id) {
          currentIdRef.current = result.draft.id;
          onCreated?.(result.draft.id);
        }
      } else {
        // For published entries, use the update endpoint
        if (currentId !== null) {
          await updateEntry.mutateAsync({
            id: currentId,
            data: { title: saveTitle, content: saveContent },
          });
        }
      }

      // Update last saved reference
      lastSavedRef.current = { title: saveTitle, content: saveContent };
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setSaveStatus('error');
        console.error('Autosave failed:', error);
      }
    } finally {
      isSavingRef.current = false;
      
      // Check if there's a pending save that was queued while we were saving
      const pending = pendingSaveRef.current;
      if (pending && (pending.title !== lastSavedRef.current?.title || pending.content !== lastSavedRef.current?.content)) {
        pendingSaveRef.current = null;
        // Use setTimeout to avoid deep recursion
        setTimeout(() => performSave(pending.title, pending.content), 100);
      }
    }
  }, [status, saveDraft, updateEntry, onCreated]);

  // Immediate save function (exposed to parent)
  const saveNow = useCallback(async () => {
    clearPendingTimeout();
    
    if (!isDirty) return;
    
    await performSave(title, content);
  }, [clearPendingTimeout, isDirty, performSave, title, content]);

  // Effect to handle debounced autosave
  useEffect(() => {
    // Don't autosave if not enabled or not initialized
    if (!enabled || !isInitialized) return;
    
    // Don't autosave published entries - they require manual save
    if (status === 'published') return;
    
    // Don't autosave if nothing has changed
    if (!isDirty) return;

    // Mark as unsaved
    setSaveStatus('unsaved');

    // Clear existing timeout
    clearPendingTimeout();

    // Store the pending save values
    pendingSaveRef.current = { title, content };

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const pending = pendingSaveRef.current;
      if (pending) {
        performSave(pending.title, pending.content);
      }
    }, debounceMs);

    return () => {
      clearPendingTimeout();
    };
  }, [title, content, status, enabled, isInitialized, isDirty, debounceMs, clearPendingTimeout, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    saveNow,
    saveStatus,
    lastSavedAt,
    isSaving: saveDraft.isPending || updateEntry.isPending,
    isDirty,
  };
}

export default useAutosave;
