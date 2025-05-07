import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorTable from '@/components/vendors/VendorTable';
import VendorForm from '@/components/vendors/VendorForm';
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

const VendorsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vendors/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Vendor deleted",
        description: "The vendor has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete vendor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddVendor = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditVendor = (id: number) => {
    setSelectedVendorId(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteVendor = (id: number) => {
    setSelectedVendorId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedVendorId) {
      deleteMutation.mutate(selectedVendorId);
    }
  };

  return (
    <DashboardLayout title="Vendors" subtitle="Manage all vendors on your platform">
      <VendorTable
        onAddVendor={handleAddVendor}
        onEditVendor={handleEditVendor}
        onDeleteVendor={handleDeleteVendor}
      />

      {/* Add Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <VendorForm
            onSuccess={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <VendorForm
            vendorId={selectedVendorId || undefined}
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
              This action cannot be undone. This will permanently delete the vendor
              account, all associated data, and remove access from the platform.
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

export default VendorsPage;
