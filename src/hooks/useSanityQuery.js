import { useState, useEffect, useRef, useCallback } from 'react';
import { client } from '../sanity';

// In-memory query cache entry structure:
// key -> { data, timestamp, promise }
const queryCache = new Map();

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CACHE_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Deduplicated, cached Sanity fetch utility
 */
export async function cachedSanityFetch(query, params = {}, options = {}) {
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;
  const cacheKey = `${query}::${JSON.stringify(params)}`;
  const now = Date.now();

  const cached = queryCache.get(cacheKey);

  // Return cached data if fresh and no force-refresh requested
  if (cached && cached.data !== undefined && (now - cached.timestamp < staleTime) && !options.force) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  if (cached?.promise) {
    return cached.promise;
  }

  const fetchPromise = client.fetch(query, params)
    .then((result) => {
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        promise: null
      });
      return result;
    })
    .catch((err) => {
      // Clear promise on failure so subsequent attempts can retry
      if (queryCache.has(cacheKey)) {
        const existing = queryCache.get(cacheKey);
        if (existing) existing.promise = null;
      }
      throw err;
    });

  queryCache.set(cacheKey, {
    data: cached?.data,
    timestamp: cached?.timestamp || 0,
    promise: fetchPromise
  });

  return fetchPromise;
}

/**
 * React hook for Sanity data with stale-while-revalidate caching and deduplication
 */
export function useSanityQuery(query, params = {}, options = {}) {
  const initialFallback = options.initialData ?? null;
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;
  const cacheKey = `${query}::${JSON.stringify(params)}`;

  const [data, setData] = useState(() => {
    const cached = queryCache.get(cacheKey);
    return cached?.data !== undefined ? cached.data : initialFallback;
  });

  const [isLoading, setIsLoading] = useState(() => {
    const cached = queryCache.get(cacheKey);
    return !cached || cached.data === undefined;
  });

  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const executeFetch = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await cachedSanityFetch(query, params, options);
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        setIsLoading(false);
      }
      return null;
    }
  }, [query, cacheKey]);

  useEffect(() => {
    isMountedRef.current = true;
    const now = Date.now();
    const cached = queryCache.get(cacheKey);

    if (cached?.data !== undefined) {
      setData(cached.data);
      if (now - cached.timestamp >= staleTime) {
        // Stale data exists: serve it immediately, revalidate in background
        executeFetch(true);
      } else {
        setIsLoading(false);
      }
    } else {
      executeFetch(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [cacheKey, staleTime, executeFetch]);

  const refetch = useCallback(() => executeFetch(false), [executeFetch]);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refetch
  };
}

/**
 * Utility to pre-warm or invalidate queries
 */
export function invalidateSanityQuery(query, params = {}) {
  const cacheKey = `${query}::${JSON.stringify(params)}`;
  queryCache.delete(cacheKey);
}

export function clearSanityCache() {
  queryCache.clear();
}
