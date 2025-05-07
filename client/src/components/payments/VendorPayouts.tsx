import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Payout } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface VendorPayoutsProps {
  payouts: Payout[];
}

const VendorPayouts = ({ payouts }: VendorPayoutsProps) => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionType, setActionType] = useState<"view" | "approve" | "reject">("view");
  const [notes, setNotes] = useState<string>("");
  
  // Filter payouts based on status
  const filteredPayouts = payouts.filter(
    (payout) => filterStatus === "all" || payout.status === filterStatus
  );
  
  // Approve payout mutation
  const approveMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/platform/payouts/${payoutId}/approve`,
        { notes }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout approved",
        description: "The payout has been approved and will be processed.",
      });
      
      // Reset and close dialog
      setOpenDialog(false);
      setSelectedPayout(null);
      setNotes("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/platform/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/earnings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve payout",
        description: error.message || "An error occurred while processing the payout.",
        variant: "destructive",
      });
    },
  });
  
  // Reject payout mutation
  const rejectMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/platform/payouts/${payoutId}/reject`,
        { notes }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout rejected",
        description: "The payout has been rejected and the vendor has been notified.",
      });
      
      // Reset and close dialog
      setOpenDialog(false);
      setSelectedPayout(null);
      setNotes("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/platform/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/earnings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject payout",
        description: error.message || "An error occurred while rejecting the payout.",
        variant: "destructive",
      });
    },
  });
  
  const handleAction = (payout: Payout, action: "view" | "approve" | "reject") => {
    setSelectedPayout(payout);
    setActionType(action);
    setOpenDialog(true);
  };
  
  const handleConfirmAction = () => {
    if (!selectedPayout) return;
    
    if (actionType === "approve") {
      approveMutation.mutate(selectedPayout.id);
    } else if (actionType === "reject") {
      rejectMutation.mutate(selectedPayout.id);
    } else {
      // Just close dialog for view
      setOpenDialog(false);
      setSelectedPayout(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div>
      {/* Filter bar */}
      <div className="flex justify-end mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Payouts table */}
      {filteredPayouts.length > 0 ? (
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">Vendor #{payout.vendorId}</td>
                  <td className="px-6 py-4">{formatDate(payout.createdAt)}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(payout.amount)}</td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(payout.status)}
                    >
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {payout.method.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAction(payout, "view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {payout.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction(payout, "approve")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(payout, "reject")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-6 text-muted-foreground">
          No payout requests matching the selected filter
        </div>
      )}
      
      {/* Payout action dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "view" 
                ? "Payout Details" 
                : actionType === "approve" 
                  ? "Approve Payout" 
                  : "Reject Payout"
              }
            </DialogTitle>
            <DialogDescription>
              {actionType === "view"
                ? "Viewing details for this payout request"
                : actionType === "approve"
                  ? "Are you sure you want to approve this payout request?"
                  : "Are you sure you want to reject this payout request?"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayout && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor ID</p>
                  <p>{selectedPayout.vendorId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayout.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date Requested</p>
                  <p>{formatDate(selectedPayout.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p>{selectedPayout.method.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(selectedPayout.status)}
                  >
                    {selectedPayout.status.charAt(0).toUpperCase() + selectedPayout.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fee</p>
                  <p className="text-muted-foreground">{formatCurrency(selectedPayout.fee)}</p>
                </div>
              </div>
              
              {selectedPayout.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Vendor Notes</p>
                  <p className="text-sm mt-1 p-2 rounded bg-gray-50">{selectedPayout.notes}</p>
                </div>
              )}
              
              {actionType !== "view" && (
                <div className="mb-4">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    placeholder={`Add notes for ${actionType === "approve" ? "approval" : "rejection"}...`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            
            {actionType !== "view" && (
              <Button 
                onClick={handleConfirmAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant={actionType === "approve" ? "default" : "destructive"}
              >
                {(approveMutation.isPending || rejectMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {actionType === "approve" ? "Approve Payout" : "Reject Payout"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPayouts;