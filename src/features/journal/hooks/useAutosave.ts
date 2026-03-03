/**
 * Autosave Hook
 * Debounced autosave with proper cancellation and race condition handling.
 *
 * Root-cause fix (see commit message for full analysis):
 *
 * Previous bug: `performSave` was a `useCallback` that captured `saveDraft` and
 * `updateEntry` mutation objects as dependencies. TanStack Query creates a new
 * mutation-object reference every time `isPending` toggles (true → false after
 * each save). This caused `performSave` to be recreated, which caused the debounce
 * `useEffect` (that listed `performSave` as a dep) to re-fire immediately after
 * every completed save. The effect then scheduled a new debounce timer, and the
 * concurrent `finally`-block timer from the just-finished save also fired — two
 * concurrent `POST /drafts` requests without an `id` = two new draft records every
 * save cycle. The same mutation-state oscillation drove `isSaving` (derived from
 * `saveDraft.isPending`) to flicker, causing button flickering.
 *
 * Fix:
 *  1. `performSave` is now `useCallback(fn, [])` — a truly stable reference.
 *     All live values (title, content, status, mutations, onCreated) are read from
 *     refs that are kept up-to-date via a no-dep sync effect.
 *  2. The debounce effect therefore only re-runs on actual content/control changes:
 *     `[title, content, status, enabled, isInitialized, debounceMs]`.
 *  3. The `finally`-block recursive timeout is removed entirely. If the user keeps
 *     typing while a save is in progress, the debounce effect will schedule its own
 *     timer once the latest `title`/`content` change arrives.
 *  4. `isSaving` is now local state controlled directly by `performSave`, not
 *     derived from `saveDraft.isPending`, so the UI never flickers from internal
 *     query-state transitions.
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
  /** Cancel any pending debounce timer without saving */
  cancelPendingSave: () => void;
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
  // Instantiate mutations once — we keep them current via refs below.
  const saveDraftMutation = useSaveDraft();
  const updateEntryMutation = useUpdateEntry();

  // ---------------------------------------------------------------------------
  // State visible to the UI
  // ---------------------------------------------------------------------------
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Use local state for isSaving so it is NOT driven by saveDraft.isPending.
  // Driving it from mutation state caused the original flicker: every completed
  // save toggled isPending → new performSave reference → effect re-run → new timer.
  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Stable refs — updated every render so performSave never reads stale values
  // ---------------------------------------------------------------------------
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIdRef = useRef<number | null>(id);
  const isSavingRef = useRef(false); // concurrency lock

  // Live-value refs (updated each render, no extra state changes)
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const statusRef = useRef(status);
  const enabledRef = useRef(enabled);
  const isInitializedRef = useRef(isInitialized);
  const onCreatedRef = useRef(onCreated);
  const debounceRef = useRef(debounceMs);
  const saveDraftMutationRef = useRef(saveDraftMutation);
  const updateEntryMutationRef = useRef(updateEntryMutation);

  // Sync all live values into refs after every render (pure ref mutation, no
  // re-renders triggered).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    statusRef.current = status;
    enabledRef.current = enabled;
    isInitializedRef.current = isInitialized;
    onCreatedRef.current = onCreated;
    debounceRef.current = debounceMs;
    saveDraftMutationRef.current = saveDraftMutation;
    updateEntryMutationRef.current = updateEntryMutation;
  }); // intentionally no deps — runs after every render

  // Keep currentIdRef in sync with the id prop
  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  // Initialize lastSavedRef exactly once when data has been loaded.
  // Intentionally omit title/content from deps: we only want to capture the
  // values at the moment isInitialized first becomes true.
  useEffect(() => {
    if (isInitialized && lastSavedRef.current === null) {
      lastSavedRef.current = {
        title: titleRef.current,
        content: contentRef.current,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // ---------------------------------------------------------------------------
  // isDirty — computed inline from current render values vs last snapshot
  // ---------------------------------------------------------------------------
  const isDirty =
    lastSavedRef.current !== null &&
    (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content);

  // Track unsaved status for published entries (manual save only, no autosave)
  useEffect(() => {
    if (!isInitialized || status !== 'published') return;
    if (isDirty) {
      setSaveStatus('unsaved');
    } else if (saveStatus === 'unsaved') {
      setSaveStatus('idle');
    }
  }, [isDirty, isInitialized, status, saveStatus]);

  // ---------------------------------------------------------------------------
  // Stable clearPendingTimeout — deps: [] so it never changes reference
  // ---------------------------------------------------------------------------
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // performSave — stable reference (deps: []).
  //
  // All live values are read from refs, so this function never needs to be
  // recreated. This is the key fix: previously, `performSave` captured
  // `saveDraft`/`updateEntry` in its closure deps, causing it to be recreated
  // on every mutation-state change, which in turn triggered the debounce effect
  // to re-fire and schedule a new, redundant save timer.
  // ---------------------------------------------------------------------------
  const performSave = useCallback(async (saveTitle: string, saveContent: string) => {
    // Concurrency guard — only one save in flight at a time.
    // If a save is already running, do nothing here: the debounce effect will
    // schedule another timer when the user's next keystroke arrives (because
    // title/content will have changed again relative to lastSavedRef).
    if (isSavingRef.current) {
      console.log('[Autosave] Save already in progress, skipping');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const currentId = currentIdRef.current;
      const currentStatus = statusRef.current;

      if (currentStatus === 'draft') {
        console.log('[Autosave] Saving draft', { id: currentId, title: saveTitle });
        const result = await saveDraftMutationRef.current.mutateAsync({
          id: currentId ?? undefined,
          title: saveTitle,
          content: saveContent,
        });

        // For a brand-new entry: store the server-assigned ID and notify parent.
        // The parent updates the URL so subsequent autosaves correctly pass the
        // id and hit PUT (update) instead of POST (create).
        if (currentId === null && result.draft.id) {
          currentIdRef.current = result.draft.id;
          onCreatedRef.current?.(result.draft.id);
          console.log('[Autosave] New draft created with id', result.draft.id);
        }
      } else if (currentId !== null) {
        // Published entries: update via the general entry endpoint
        console.log('[Autosave] Updating published entry', { id: currentId });
        await updateEntryMutationRef.current.mutateAsync({
          id: currentId,
          data: { title: saveTitle, content: saveContent },
        });
      }

      // Mark this content as "saved baseline" — isDirty will be false until
      // the user types something different.
      lastSavedRef.current = { title: saveTitle, content: saveContent };
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      console.log('[Autosave] Save completed successfully', { at: new Date().toISOString() });
    } catch (error) {
      // AbortError is expected when requests are cancelled; treat everything
      // else as a visible error.
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (!isAbort) {
        setSaveStatus('error');
        console.error('[Autosave] Save failed:', error);
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      // NOTE: No recursive/queued save here. If the user has continued typing
      // while this save was running, `title`/`content` props will have changed
      // relative to the new `lastSavedRef`. The debounce effect (watching
      // [title, content, ...]) will have already scheduled a new timer for
      // the latest content — no extra work needed here.
    }
  }, []); // stable — reads all values through refs

  // ---------------------------------------------------------------------------
  // saveNow — immediate save bypassing debounce (exposed to parent)
  // ---------------------------------------------------------------------------
  const saveNow = useCallback(async () => {
    clearPendingTimeout();

    // Re-compute dirty from refs so we don't close over stale isDirty
    const dirty =
      lastSavedRef.current !== null &&
      (titleRef.current !== lastSavedRef.current.title ||
        contentRef.current !== lastSavedRef.current.content);

    if (!dirty) return;

    await performSave(titleRef.current, contentRef.current);
  }, [clearPendingTimeout, performSave]); // both stable

  // ---------------------------------------------------------------------------
  // Debounce effect — the ONLY place a save timer is scheduled.
  //
  // Dependencies: [title, content, status, enabled, isInitialized, debounceMs]
  //
  // Notably absent: `performSave` and `clearPendingTimeout` — they are stable
  // (`useCallback(fn, [])`) so including them would be safe, but omitting them
  // keeps the intent clear: this effect fires ONLY on actual content changes.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !isInitialized) return;
    if (status === 'published') return;

    // Compute dirty inline using the ref snapshot so we do not depend on the
    // `isDirty` computed value (which could change from ref mutations without
    // triggering this effect).
    const dirty =
      lastSavedRef.current !== null &&
      (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content);

    if (!dirty) return;

    setSaveStatus('unsaved');

    // Cancel any previously scheduled timer before starting a new one.
    clearPendingTimeout();

    timeoutRef.current = setTimeout(() => {
      // Read the latest values at fire-time from refs, not from the closure.
      // This is safe because we keep refs in sync every render (the no-dep
      // sync effect above). By the time this timer fires (≥debounceMs later),
      // the refs will reflect the most recent user input.
      console.log('[Autosave] Debounce timer fired');
      performSave(titleRef.current, contentRef.current);
    }, debounceMs);

    return () => {
      clearPendingTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, status, enabled, isInitialized, debounceMs]);
  // ↑ clearPendingTimeout and performSave intentionally omitted — both are
  //   stable ([] deps) so adding them would cause no extra runs, but excluding
  //   them makes the contract explicit: only input changes trigger autosave.

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  // Expose timer cancellation so callers (e.g. handlePublish) can prevent a
  // queued autosave from racing with a manual operation.
  const cancelPendingSave = useCallback(() => {
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  return {
    saveNow,
    cancelPendingSave,
    saveStatus,
    lastSavedAt,
    isSaving,
    isDirty,
  };
}

export default useAutosave;
