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

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  isImpersonating: boolean;
  requestOtpMutation: UseMutationResult<{ message: string; previewUrl?: string }, Error, { email: string }>;
  verifyOtpMutation: UseMutationResult<User, Error, { email: string; otp: string }>;
  logoutMutation: UseMutationResult<{ message: string }, Error, void>;
  completeProfileMutation: UseMutationResult<User, Error, Partial<User>>;
  impersonateUserMutation: UseMutationResult<User, Error, { userId: number }>;
  stopImpersonatingMutation: UseMutationResult<User, Error, void>;
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

  // Impersonate user mutation (admin only)
  const impersonateUserMutation = useMutation<User, Error, { userId: number }>({
    mutationFn: async ({ userId }) => {
      const res = await apiRequest('POST', `/api/impersonate/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to impersonate user');
      }
      return await res.json();
    },
    onSuccess: (impersonatedUser) => {
      // Update the current user in the cache with the impersonated user
      queryClient.setQueryData(['/api/auth/session'], impersonatedUser);
      
      // Invalidate queries that might be affected by the user change
      queryClient.invalidateQueries();
      
      toast({
        title: 'Impersonating User',
        description: `You are now viewing the application as ${impersonatedUser.firstName || impersonatedUser.email}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Impersonation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Stop impersonating and return to original user
  const stopImpersonatingMutation = useMutation<User, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/end-impersonation');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to stop impersonation');
      }
      return await res.json();
    },
    onSuccess: (originalUser) => {
      // Update the current user in the cache with the original user
      queryClient.setQueryData(['/api/auth/session'], originalUser);
      
      // Invalidate queries that might be affected by the user change
      queryClient.invalidateQueries();
      
      toast({
        title: 'Returned to Admin',
        description: 'You are no longer impersonating a user.',
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

  // Check if the current user is being impersonated
  const isImpersonating = !!user && !!user.impersonatedBy;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        isImpersonating,
        requestOtpMutation,
        verifyOtpMutation,
        logoutMutation,
        completeProfileMutation,
        impersonateUserMutation,
        stopImpersonatingMutation
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