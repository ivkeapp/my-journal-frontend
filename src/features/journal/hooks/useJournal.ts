/**
 * Journal TanStack Query hooks
 * Provides data fetching, caching, and mutations for journal entries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '../api';
import type {
  JournalEntry,
  CreateEntryData,
  UpdateEntryData,
  SaveDraftData,
  JournalListResponse,
  DraftListResponse,
} from '../types';

// Query keys for cache management
export const journalKeys = {
  all: ['journal'] as const,
  lists: () => [...journalKeys.all, 'list'] as const,
  list: (page: number) => [...journalKeys.lists(), page] as const,
  drafts: () => [...journalKeys.all, 'drafts'] as const,
  draftList: (page: number) => [...journalKeys.drafts(), page] as const,
  details: () => [...journalKeys.all, 'detail'] as const,
  detail: (id: number) => [...journalKeys.details(), id] as const,
  counts: () => [...journalKeys.all, 'counts'] as const,
};

/**
 * Hook to fetch published journal entries
 */
export function useJournalEntries(page = 1) {
  return useQuery({
    queryKey: journalKeys.list(page),
    queryFn: () => journalApi.listEntries(page),
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to fetch drafts
 */
export function useDrafts(page = 1) {
  return useQuery({
    queryKey: journalKeys.draftList(page),
    queryFn: () => journalApi.listDrafts(page),
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch a single journal entry
 */
export function useJournalEntry(id: number | null) {
  return useQuery({
    queryKey: journalKeys.detail(id!),
    queryFn: () => journalApi.getEntry(id!),
    enabled: id !== null,
    staleTime: 60_000, // Entry details fresh for 1 minute
  });
}

/**
 * Hook to fetch counts
 */
export function useJournalCounts() {
  return useQuery({
    queryKey: journalKeys.counts(),
    queryFn: () => journalApi.getCounts(),
    staleTime: 60_000,
  });
}

/**
 * Hook to create a published entry
 */
export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntryData) => journalApi.createEntry(data),
    onSuccess: () => {
      // Invalidate entry lists and counts
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.counts() });
    },
  });
}

/**
 * Hook to update an existing entry
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEntryData }) =>
      journalApi.updateEntry(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: journalKeys.detail(id) });

      // Snapshot the previous value
      const previousEntry = queryClient.getQueryData<JournalEntry>(journalKeys.detail(id));

      // Optimistically update the cache
      if (previousEntry) {
        queryClient.setQueryData<JournalEntry>(journalKeys.detail(id), {
          ...previousEntry,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousEntry };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousEntry) {
        queryClient.setQueryData(journalKeys.detail(id), context.previousEntry);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
    },
  });
}

/**
 * Hook to delete an entry
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => journalApi.deleteEntry(id),
    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: journalKeys.lists() });

      // Snapshot previous list state for rollback
      const previousLists = queryClient.getQueriesData<JournalListResponse>({
        queryKey: journalKeys.lists(),
      });

      // Optimistically remove from lists
      queryClient.setQueriesData<JournalListResponse>(
        { queryKey: journalKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            entries: old.entries.filter((e) => e.id !== id),
            total: old.total - 1,
          };
        }
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      // Rollback all lists
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.counts() });
    },
  });
}

/**
 * Hook to save a draft (create or update)
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveDraftData) => journalApi.saveDraft(data),
    onSuccess: (response) => {
      // Update the specific draft in cache
      queryClient.setQueryData<JournalEntry>(
        journalKeys.detail(response.draft.id),
        response.draft
      );
      // Invalidate draft lists
      queryClient.invalidateQueries({ queryKey: journalKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: journalKeys.counts() });
    },
  });
}

/**
 * Hook to publish a draft
 */
export function usePublishDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => journalApi.publishDraft(id),
    onSuccess: (response) => {
      // Update the entry in cache with published status
      queryClient.setQueryData<JournalEntry>(
        journalKeys.detail(response.entry.id),
        response.entry
      );
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: journalKeys.counts() });
    },
  });
}

/**
 * Hook to delete a draft
 */
export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => journalApi.deleteDraft(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.drafts() });

      const previousDrafts = queryClient.getQueriesData<DraftListResponse>({
        queryKey: journalKeys.drafts(),
      });

      // Optimistically remove from draft lists
      queryClient.setQueriesData<DraftListResponse>(
        { queryKey: journalKeys.drafts() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            drafts: old.drafts.filter((d) => d.id !== id),
            total: old.total - 1,
          };
        }
      );

      return { previousDrafts };
    },
    onError: (_err, _id, context) => {
      context?.previousDrafts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: journalKeys.counts() });
    },
  });
}
