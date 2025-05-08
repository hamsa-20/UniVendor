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

interface ImpersonationStatus {
  isImpersonating: boolean;
  originalUser: {
    id: number;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  impersonationStatus: ImpersonationStatus | null;
  isLoadingImpersonationStatus: boolean;
  requestOtpMutation: UseMutationResult<{ message: string; previewUrl?: string }, Error, { email: string }>;
  verifyOtpMutation: UseMutationResult<User, Error, { email: string; otp: string }>;
  logoutMutation: UseMutationResult<{ message: string }, Error, void>;
  completeProfileMutation: UseMutationResult<User, Error, Partial<User>>;
  impersonateUserMutation: UseMutationResult<{ message: string; user: User; impersonationStarted: boolean }, Error, number>;
  endImpersonationMutation: UseMutationResult<{ message: string; user: User; impersonationEnded: boolean }, Error, void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Fetch current user session with better persistence handling
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/auth/session');
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated is an expected state
            return null;
          }
          throw new Error('Failed to fetch session');
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching session:', error);
        return null;
      }
    },
    retry: 1, // Retry once in case of network issues
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when browser reconnects
    refetchOnWindowFocus: true, // Refetch when window gains focus
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
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
  
  // Fetch impersonation status
  const {
    data: impersonationStatus,
    isLoading: isLoadingImpersonationStatus,
  } = useQuery<ImpersonationStatus, Error>({
    queryKey: ['/api/auth/impersonation-status'],
    queryFn: async () => {
      if (!user) return { isImpersonating: false, originalUser: null };
      
      try {
        const res = await apiRequest('GET', '/api/auth/impersonation-status');
        if (!res.ok) {
          if (res.status === 401) {
            return { isImpersonating: false, originalUser: null };
          }
          throw new Error('Failed to fetch impersonation status');
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching impersonation status:', error);
        return { isImpersonating: false, originalUser: null };
      }
    },
    enabled: !!user, // Only run if user is logged in
  });
  
  // Impersonate user mutation
  const impersonateUserMutation = useMutation<
    { message: string; user: User; impersonationStarted: boolean },
    Error,
    number
  >({
    mutationFn: async (userId) => {
      const res = await apiRequest('POST', `/api/auth/impersonate/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to impersonate user');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the current user in the cache
      queryClient.setQueryData(['/api/auth/session'], data.user);
      // Invalidate the impersonation status to refetch it
      queryClient.invalidateQueries({ queryKey: ['/api/auth/impersonation-status'] });
      // Invalidate other queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      
      toast({
        title: 'Impersonation Started',
        description: `You are now viewing the application as ${data.user.email}`,
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
  
  // End impersonation (return to original user) mutation
  const endImpersonationMutation = useMutation<
    { message: string; user: User; impersonationEnded: boolean },
    Error,
    void
  >({
    mutationFn: async () => {
      // Using the logout endpoint which handles returning to original user
      const res = await apiRequest('POST', '/api/auth/logout');
      if (!res.ok) {
        throw new Error('Failed to end impersonation');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the current user in the cache
      if (data.user) {
        queryClient.setQueryData(['/api/auth/session'], data.user);
      }
      // Invalidate the impersonation status to refetch it
      queryClient.invalidateQueries({ queryKey: ['/api/auth/impersonation-status'] });
      // Invalidate other queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      
      toast({
        title: 'Impersonation Ended',
        description: 'You have returned to your original account.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to End Impersonation',
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
        impersonationStatus: impersonationStatus || null,
        isLoadingImpersonationStatus,
        requestOtpMutation,
        verifyOtpMutation,
        logoutMutation,
        completeProfileMutation,
        impersonateUserMutation,
        endImpersonationMutation,
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