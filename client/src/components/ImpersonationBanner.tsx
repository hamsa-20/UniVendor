import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CircleX } from 'lucide-react';

export function ImpersonationBanner() {
  const { 
    impersonationStatus, 
    isLoadingImpersonationStatus, 
    endImpersonationMutation 
  } = useAuth();
  
  // Only show banner when user is being impersonated
  if (isLoadingImpersonationStatus || !impersonationStatus?.isImpersonating) {
    return null;
  }
  
  const originalUser = impersonationStatus.originalUser;
  
  return (
    <div className="w-full bg-amber-500 text-black px-4 py-2 flex items-center justify-between">
      <div className="flex-1">
        <span className="font-semibold">
          You are viewing as {impersonationStatus.isImpersonating ? 'another user' : ''}.
        </span>
        {originalUser && (
          <span className="ml-2">
            Return to <span className="font-semibold">{originalUser.email}</span>
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-amber-600 text-black"
        onClick={() => endImpersonationMutation.mutate()}
        disabled={endImpersonationMutation.isPending}
      >
        <CircleX className="mr-2 h-4 w-4" />
        {endImpersonationMutation.isPending ? 'Ending...' : 'End Impersonation'}
      </Button>
    </div>
  );
}