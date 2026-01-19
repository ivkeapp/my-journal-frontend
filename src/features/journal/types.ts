/**
 * Journal Types
 * Based on BACKEND.md API contracts
 */

export type EntryStatus = 'draft' | 'published';

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  status: EntryStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  auto_save_at?: string | null;
}

export interface JournalListResponse {
  status: string;
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DraftListResponse {
  status: string;
  drafts: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JournalEntryResponse {
  status: string;
  entry: JournalEntry;
}

export interface DraftResponse {
  status: string;
  message: string;
  draft: JournalEntry;
}

export interface PublishResponse {
  status: string;
  message: string;
  entry: JournalEntry;
}

export interface DeleteResponse {
  status: string;
  message: string;
}

export interface CountsResponse {
  status: string;
  counts: {
    drafts: number;
    published: number;
  };
}

export interface CreateEntryData {
  title: string;
  content: string;
}

export interface UpdateEntryData {
  title: string;
  content: string;
}

export interface SaveDraftData {
  id?: number;
  title: string;
  content: string;
}

// Editor state for UI
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

export interface EditorState {
  id: number | null;
  title: string;
  content: string;
  status: EntryStatus;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  isDirty: boolean;
}
