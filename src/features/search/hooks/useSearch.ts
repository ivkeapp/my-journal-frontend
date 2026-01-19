/**
 * useSearch Hook
 * Handles debounced search with proper cancellation and race condition prevention
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchApi } from '../api';
import type { SearchResult, SearchState } from '../types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  suggestionsLimit?: number;
}

interface UseSearchReturn {
  // Query state
  query: string;
  setQuery: (query: string) => void;
  
  // Suggestions (live search while typing)
  suggestions: SearchResult[];
  suggestionsState: SearchState;
  showSuggestions: boolean;
  
  // Full results (after submitting search)
  results: SearchResult[];
  resultsState: SearchState;
  totalResults: number;
  
  // Actions
  submitSearch: () => void;
  clearSearch: () => void;
  closeSuggestions: () => void;
  
  // Error
  error: string | null;
}

export function useSearch({
  debounceMs = 300,
  minQueryLength = 2,
  suggestionsLimit = 5,
}: UseSearchOptions = {}): UseSearchReturn {
  // Query state
  const [query, setQueryInternal] = useState('');
  
  // Suggestions state (live search while typing)
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsState, setSuggestionsState] = useState<SearchState>('idle');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Full results state (after Enter/submit)
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsState, setResultsState] = useState<SearchState>('idle');
  const [totalResults, setTotalResults] = useState(0);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Refs for debounce and request tracking
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0); // To prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear pending debounce timer
  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Fetch suggestions (debounced)
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Increment request ID to track this request
    const currentRequestId = ++requestIdRef.current;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setSuggestionsState('loading');
    setError(null);
    
    try {
      const response = await searchApi.search(searchQuery, 1, suggestionsLimit);
      
      // Check if this is still the latest request (prevent race conditions)
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      setSuggestions(response.entries);
      setSuggestionsState('success');
      setShowSuggestions(true);
    } catch (err) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      // Check if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      setSuggestionsState('error');
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  }, [suggestionsLimit]);

  // Set query with debounced suggestions fetch
  const setQuery = useCallback((newQuery: string) => {
    setQueryInternal(newQuery);
    clearDebounce();
    
    // Reset suggestions if query is too short
    if (newQuery.length < minQueryLength) {
      setSuggestions([]);
      setSuggestionsState('idle');
      setShowSuggestions(false);
      return;
    }
    
    // Debounce the suggestions fetch
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newQuery);
    }, debounceMs);
  }, [clearDebounce, debounceMs, minQueryLength, fetchSuggestions]);

  // Submit full search (on Enter)
  const submitSearch = useCallback(async () => {
    clearDebounce();
    setShowSuggestions(false);
    
    if (query.length < minQueryLength) {
      return;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const currentRequestId = ++requestIdRef.current;
    
    setResultsState('loading');
    setError(null);
    
    try {
      const response = await searchApi.search(query, 1, 50);
      
      // Check for race conditions
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      setResults(response.entries);
      setTotalResults(response.total);
      setResultsState('success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      setResultsState('error');
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  }, [clearDebounce, query, minQueryLength]);

  // Clear search state
  const clearSearch = useCallback(() => {
    clearDebounce();
    setQueryInternal('');
    setSuggestions([]);
    setSuggestionsState('idle');
    setShowSuggestions(false);
    setResults([]);
    setResultsState('idle');
    setTotalResults(0);
    setError(null);
  }, [clearDebounce]);

  // Close suggestions dropdown
  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDebounce();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearDebounce]);

  return {
    query,
    setQuery,
    suggestions,
    suggestionsState,
    showSuggestions,
    results,
    resultsState,
    totalResults,
    submitSearch,
    clearSearch,
    closeSuggestions,
    error,
  };
}

export default useSearch;
