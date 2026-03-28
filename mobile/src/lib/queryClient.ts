import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min — show stale while refetching
      gcTime: 1000 * 60 * 60 * 24,     // 24h — cache survives restart via persister
      retry: (failureCount, error: unknown) => {
        // Never retry 4xx (auth/validation errors)
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "ENFIT_QUERY_CACHE",
  // Throttle writes to avoid excessive I/O
  throttleTime: 2000,
});
