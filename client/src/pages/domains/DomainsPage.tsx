import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DomainTable from '@/components/domains/DomainTable';
import DomainForm from '@/components/domains/DomainForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const DomainsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/domains/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Domain deleted",
        description: "The domain has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete domain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddDomain = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditDomain = (id: number) => {
    setSelectedDomainId(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDomain = (id: number) => {
    setSelectedDomainId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDomainId) {
      deleteMutation.mutate(selectedDomainId);
    }
  };

  return (
    <DashboardLayout title="Domains" subtitle="Manage all domains connected to vendor stores">
      <DomainTable
        onAddDomain={handleAddDomain}
        onEditDomain={handleEditDomain}
        onDeleteDomain={handleDeleteDomain}
      />

      {/* Add Domain Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DomainForm
            onSuccess={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DomainForm
            domainId={selectedDomainId || undefined}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the domain
              and remove it from the vendor's store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DomainsPage;
