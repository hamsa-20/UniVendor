import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserImpersonationProps {
  userId: number;
  userEmail: string;
}

export function UserImpersonation({ userId, userEmail }: UserImpersonationProps) {
  const { user, impersonateUserMutation } = useAuth();
  
  // Only super_admin can impersonate
  if (user?.role !== 'super_admin') {
    return null;
  }
  
  const handleImpersonate = () => {
    if (window.confirm(`Are you sure you want to impersonate ${userEmail}?`)) {
      impersonateUserMutation.mutate(userId);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600"
            onClick={handleImpersonate}
            disabled={impersonateUserMutation.isPending}
          >
            <UserIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Impersonate this user</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}