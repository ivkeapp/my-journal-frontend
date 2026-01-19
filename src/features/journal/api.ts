/**
 * Journal API Service
 * Follows BACKEND.md API contracts exactly
 */

import { api } from '@/lib/api';
import type {
  JournalListResponse,
  DraftListResponse,
  JournalEntry,
  JournalEntryResponse,
  DraftResponse,
  PublishResponse,
  DeleteResponse,
  CountsResponse,
  CreateEntryData,
  UpdateEntryData,
  SaveDraftData,
} from './types';

export const journalApi = {
  /**
   * GET /api/journal - List published entries
   */
  async listEntries(page = 1, limit = 20): Promise<JournalListResponse> {
    return api.get<JournalListResponse>(`/journal?page=${page}&limit=${limit}`);
  },

  /**
   * GET /api/journal/:id - Get single journal entry
   * Backend returns { status: "ok", entry: {...} }
   */
  async getEntry(id: number): Promise<JournalEntry> {
    const response = await api.get<JournalEntryResponse>(`/journal/${id}`);
    return response.entry;
  },

  /**
   * POST /api/journal - Create published entry
   */
  async createEntry(data: CreateEntryData): Promise<JournalEntryResponse> {
    return api.post<JournalEntryResponse>('/journal', data);
  },

  /**
   * PUT /api/journal/:id - Update journal entry
   */
  async updateEntry(id: number, data: UpdateEntryData): Promise<JournalEntryResponse> {
    return api.put<JournalEntryResponse>(`/journal/${id}`, data);
  },

  /**
   * DELETE /api/journal/:id - Delete journal entry
   */
  async deleteEntry(id: number): Promise<DeleteResponse> {
    return api.delete<DeleteResponse>(`/journal/${id}`);
  },

  /**
   * GET /api/journal/drafts - List all drafts
   */
  async listDrafts(page = 1, limit = 20): Promise<DraftListResponse> {
    return api.get<DraftListResponse>(`/journal/drafts?page=${page}&limit=${limit}`);
  },

  /**
   * POST /api/journal/drafts - Create or auto-save draft
   * If id is provided, updates existing draft
   * If no id, creates new draft
   */
  async saveDraft(data: SaveDraftData): Promise<DraftResponse> {
    return api.post<DraftResponse>('/journal/drafts', data);
  },

  /**
   * POST /api/journal/drafts/:id/publish - Publish a draft
   */
  async publishDraft(id: number): Promise<PublishResponse> {
    return api.post<PublishResponse>(`/journal/drafts/${id}/publish`);
  },

  /**
   * DELETE /api/journal/drafts/:id - Delete a draft
   */
  async deleteDraft(id: number): Promise<DeleteResponse> {
    return api.delete<DeleteResponse>(`/journal/drafts/${id}`);
  },

  /**
   * GET /api/journal/counts - Get draft/published counts
   */
  async getCounts(): Promise<CountsResponse> {
    return api.get<CountsResponse>('/journal/counts');
  },
};

export default journalApi;
