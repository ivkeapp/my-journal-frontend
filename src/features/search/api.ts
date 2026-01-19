/**
 * Search API Service
 * Follows BACKEND.md API contracts exactly
 */

import { api } from '@/lib/api';
import type { SearchResponse, SearchStatsResponse, RebuildResponse } from './types';

export const searchApi = {
  /**
   * GET /api/journal/search?q=term - Search entries
   */
  async search(query: string, page = 1, limit = 20): Promise<SearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    return api.get<SearchResponse>(`/journal/search?q=${encodedQuery}&page=${page}&limit=${limit}`);
  },

  /**
   * POST /api/journal/search/rebuild - Rebuild search index
   */
  async rebuild(): Promise<RebuildResponse> {
    return api.post<RebuildResponse>('/journal/search/rebuild');
  },

  /**
   * GET /api/journal/search/stats - Get search index stats
   */
  async getStats(): Promise<SearchStatsResponse> {
    return api.get<SearchStatsResponse>('/journal/search/stats');
  },
};

export default searchApi;
