import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get base URL for API requests
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000';
  }
  // Server-side environment
  return process.env.API_URL || 'http://localhost:5000';
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// API request function
export const apiRequest = async (method: string, endpoint: string, body?: any) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response;
};

// Query function for React Query
export const getQueryFn: QueryFunction = async ({ queryKey }) => {
  const baseUrl = getBaseUrl();
  const endpoint = queryKey[0] as string;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Query failed');
  }
  
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
