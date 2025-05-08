import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { UserPlus } from "lucide-react";

interface UserImpersonationProps {
  userId: number;
  userEmail: string;
}

export function UserImpersonation({ userId, userEmail }: UserImpersonationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { impersonateUserMutation } = useAuth();
  const { toast } = useToast();
  
  const handleImpersonation = async () => {
    try {
      await impersonateUserMutation.mutateAsync(userId);
      
      setIsDialogOpen(false);
      
      toast({
        title: "Impersonation Active",
        description: `You are now impersonating user ${userEmail}`,
      });
      
      // Redirect to vendor dashboard or home page after successful impersonation
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Impersonation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Impersonate User">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
          <DialogDescription>
            You are about to impersonate {userEmail}. This will allow you to view and interact with the platform as this user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            During impersonation:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
            <li>You'll have the same access level as the user</li>
            <li>Your actions will be logged as performed by an admin</li>
            <li>You can return to your admin account anytime</li>
          </ul>
        </div>
        
        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default">Start Impersonation</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to impersonate user {userEmail}. This action will be logged in the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleImpersonation}>
                  Confirm Impersonation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}