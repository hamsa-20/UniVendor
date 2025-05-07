import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useQuery, 
  useMutation, 
  UseMutationResult,
  QueryClient,
  UseQueryOptions
} from '@tanstack/react-query';
import { User } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  requestOtpMutation: UseMutationResult<{ message: string; previewUrl?: string }, Error, { email: string }>;
  verifyOtpMutation: UseMutationResult<User, Error, { email: string; otp: string }>;
  logoutMutation: UseMutationResult<{ message: string }, Error, void>;
  completeProfileMutation: UseMutationResult<User, Error, Partial<User>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Fetch current user session with better persistence handling
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchSession
  } = useQuery<User | null, Error>({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      try {
        console.log("Fetching session data...");
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include', // Essential for cookies to be sent
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log("Session response status:", res.status);
        
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated is an expected state
            console.log("Not authenticated (401)");
            return null;
          }
          const errorText = await res.text();
          console.error("Session fetch error:", errorText);
          throw new Error(`Failed to fetch session: ${res.status} ${errorText}`);
        }
        
        const userData = await res.json();
        console.log("Session data retrieved:", userData ? "User authenticated" : "No user data");
        return userData;
      } catch (error) {
        console.error('Error fetching session:', error);
        return null;
      }
    },
    retry: 2, // Retry twice in case of network issues
    retryDelay: 1000, // Wait 1 second between retries
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when browser reconnects
    refetchOnWindowFocus: true, // Refetch when window gains focus
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // Cache data for 24 hours (formerly cacheTime)
  });

  // Request OTP mutation
  const requestOtpMutation = useMutation<
    { message: string; previewUrl?: string },
    Error,
    { email: string }
  >({
    mutationFn: async ({ email }) => {
      const res = await apiRequest('POST', '/api/auth/request-otp', { email });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation<
    User,
    Error,
    { email: string; otp: string }
  >({
    mutationFn: async ({ email, otp }) => {
      const res = await apiRequest('POST', '/api/auth/verify-otp', { email, otp });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/session'], data);
      toast({
        title: 'Login Successful',
        description: 'You are now logged in.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout');
      if (!res.ok) {
        throw new Error('Failed to log out');
      }
      return await res.json();
    },
    onSuccess: () => {
      // Clear the user from the cache
      queryClient.setQueryData(['/api/auth/session'], null);
      // Invalidate all queries that depend on authentication
      queryClient.invalidateQueries();
      
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Logout Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete user profile mutation
  const completeProfileMutation = useMutation<User, Error, Partial<User>>({
    mutationFn: async (profileData) => {
      if (!user) throw new Error('Not authenticated');
      
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, profileData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/auth/session'], updatedUser);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        requestOtpMutation,
        verifyOtpMutation,
        logoutMutation,
        completeProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}