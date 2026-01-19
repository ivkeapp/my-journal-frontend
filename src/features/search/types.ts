/**
 * Search Types
 * Based on BACKEND.md API contracts
 */

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  _searchScore: number;
  _searchSnippet: string;
}

export interface SearchResponse {
  status: string;
  entries: SearchResult[];
  total: number;
  query: string;
  page: number;
  limit: number;
}

export interface SearchStatsResponse {
  status: string;
  stats: {
    initialized: boolean;
    documentCount: number;
  };
}

export interface RebuildResponse {
  status: string;
  message: string;
  entriesIndexed: number;
}

export type SearchState = 'idle' | 'loading' | 'success' | 'error';
