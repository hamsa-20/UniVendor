import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonatingMutation } = useAuth();
  const [_, setLocation] = useLocation();

  // Only show banner if user is being impersonated
  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-amber-700 font-medium">
            You are currently impersonating this vendor account
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopImpersonatingMutation.mutate()}
          disabled={stopImpersonatingMutation.isPending}
          className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
        >
          {stopImpersonatingMutation.isPending ? (
            <span className="animate-pulse">Returning...</span>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Admin
            </>
          )}
        </Button>
      </div>
    </div>
  );
}