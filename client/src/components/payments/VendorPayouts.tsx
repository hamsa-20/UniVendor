import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle, Download, Eye, Search, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Payout {
  id: number;
  createdAt: Date | null;
  completedAt: Date | null;
  vendorId: number;
  status: string;
  amount: string;
  paymentMethod: string;
  accountDetails: string;
  notes: string | null;
  adminNotes: string | null;
}

interface VendorPayoutsProps {
  payouts: Payout[];
  title?: string;
  isAdmin?: boolean;
}

const VendorPayouts: React.FC<VendorPayoutsProps> = ({
  payouts,
  title = "Payout Requests",
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter payouts based on tab, search, and date range
  const filteredPayouts = payouts.filter((payout) => {
    // Tab filter
    if (activeTab !== "all" && payout.status !== activeTab) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const idMatch = payout.id.toString().includes(query);
      const amountMatch = payout.amount.includes(query);
      const methodMatch = payout.paymentMethod.toLowerCase().includes(query);
      
      if (!idMatch && !amountMatch && !methodMatch) {
        return false;
      }
    }

    // Date range filter
    if (dateRange.from && payout.createdAt && new Date(payout.createdAt) < dateRange.from) {
      return false;
    }
    if (dateRange.to && payout.createdAt && new Date(payout.createdAt) > dateRange.to) {
      return false;
    }

    return true;
  });

  // Sort payouts by creation date (newest first)
  const sortedPayouts = [...filteredPayouts].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Handle viewing payout details
  const handleView = (payout: Payout) => {
    setSelectedPayout(payout);
  };

  // Handle approve payout mutation
  const approveMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/platform/payouts/${payoutId}/approve`,
        { notes: adminNotes }
      );
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout approved",
        description: "The payout request has been approved successfully.",
      });
      
      // Reset admin notes
      setAdminNotes("");
      
      // Reset selected payout
      setSelectedPayout(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/platform/payouts"] });
      
      // Also invalidate vendor-specific queries
      if (selectedPayout) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/vendors/${selectedPayout.vendorId}/payouts`] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve payout",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle reject payout mutation
  const rejectMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/platform/payouts/${payoutId}/reject`,
        { notes: adminNotes }
      );
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout rejected",
        description: "The payout request has been rejected.",
      });
      
      // Reset admin notes
      setAdminNotes("");
      
      // Reset selected payout
      setSelectedPayout(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/platform/payouts"] });
      
      // Also invalidate vendor-specific queries
      if (selectedPayout) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/vendors/${selectedPayout.vendorId}/payouts`] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject payout",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle approve action
  const handleApprove = () => {
    if (selectedPayout) {
      approveMutation.mutate(selectedPayout.id);
    }
  };

  // Handle reject action
  const handleReject = () => {
    if (selectedPayout) {
      rejectMutation.mutate(selectedPayout.id);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="font-medium">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="font-medium">
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-medium">
            Rejected
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="font-medium">
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium">
            {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        );
    }
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "venmo":
        return "Venmo";
      case "zelle":
        return "Zelle";
      case "other":
        return "Other";
      default:
        return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Get counts for tabs
  const getCounts = () => {
    const all = payouts.length;
    const pending = payouts.filter(p => p.status === "pending").length;
    const completed = payouts.filter(p => p.status === "completed").length;
    const rejected = payouts.filter(p => p.status === "rejected").length;
    
    return { all, pending, completed, rejected };
  };

  const counts = getCounts();

  // Export payouts to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Status",
      "Amount",
      "Payment Method",
      "Completed Date",
      "Vendor ID",
    ].join(",");

    const csvRows = sortedPayouts.map((p) => {
      const row = [
        p.id,
        p.createdAt ? format(new Date(p.createdAt), "yyyy-MM-dd") : "",
        p.status,
        p.amount,
        p.paymentMethod,
        p.completedAt ? format(new Date(p.completedAt), "yyyy-MM-dd") : "",
        p.vendorId,
      ].join(",");
      return row;
    });

    const csvContent = [headers, ...csvRows].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Create filename with current date
    const date = format(new Date(), "yyyy-MM-dd");
    link.setAttribute("href", url);
    link.setAttribute("download", `payouts_${date}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {payouts.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <TabsList>
              <TabsTrigger value="all">
                All
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {counts.all}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {counts.pending}
                </span>
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {counts.completed}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {counts.rejected}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search payouts..."
                  className="w-full pl-8 sm:w-[180px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) =>
                      setDateRange({
                        from: range?.from || null,
                        to: range?.to || null,
                      })
                    }
                    initialFocus
                  />
                  <div className="flex justify-end gap-2 p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ from: null, to: null })}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <TabsContent value="all" className="pt-2">
            {renderPayoutTable(sortedPayouts)}
          </TabsContent>
          <TabsContent value="pending" className="pt-2">
            {renderPayoutTable(sortedPayouts)}
          </TabsContent>
          <TabsContent value="completed" className="pt-2">
            {renderPayoutTable(sortedPayouts)}
          </TabsContent>
          <TabsContent value="rejected" className="pt-2">
            {renderPayoutTable(sortedPayouts)}
          </TabsContent>
        </Tabs>

        {/* Payout Details Dialog */}
        <Dialog open={selectedPayout !== null} onOpenChange={(open) => !open && setSelectedPayout(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Payout Request Details</DialogTitle>
              <DialogDescription>
                Payout request #{selectedPayout?.id} - {selectedPayout?.status}
              </DialogDescription>
            </DialogHeader>
            
            {selectedPayout && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Request Date</h4>
                    <p className="mt-1">
                      {selectedPayout.createdAt 
                        ? format(new Date(selectedPayout.createdAt), "PPP") 
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <p className="mt-1">{getStatusBadge(selectedPayout.status)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                    <p className="mt-1 font-medium">${parseFloat(selectedPayout.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                    <p className="mt-1">{formatPaymentMethod(selectedPayout.paymentMethod)}</p>
                  </div>
                  {selectedPayout.completedAt && (
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Completed Date</h4>
                      <p className="mt-1">
                        {format(new Date(selectedPayout.completedAt), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Account Details</h4>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {selectedPayout.accountDetails}
                  </p>
                </div>
                
                {selectedPayout.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Vendor Notes</h4>
                    <p className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {selectedPayout.notes}
                    </p>
                  </div>
                )}
                
                {selectedPayout.adminNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Admin Notes</h4>
                    <p className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {selectedPayout.adminNotes}
                    </p>
                  </div>
                )}
                
                {isAdmin && selectedPayout.status === "pending" && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Admin Notes</h4>
                    <Textarea
                      placeholder="Add notes about this payout request..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              
              {isAdmin && selectedPayout?.status === "pending" && (
                <div className="flex space-x-2 mb-2 sm:mb-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Payout Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this payout request? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject}>
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Payout Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve this payout request for ${parseFloat(selectedPayout.amount).toFixed(2)}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  // Helper function to render payout table
  function renderPayoutTable(payouts: Payout[]) {
    if (payouts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <p className="text-muted-foreground">No payout requests found</p>
          {(searchQuery || dateRange.from || dateRange.to) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setDateRange({ from: null, to: null });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              {isAdmin && <TableHead>Vendor</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id} className={cn(
                payout.status === "pending" && isAdmin && "bg-muted/30"
              )}>
                <TableCell className="font-medium">{payout.id}</TableCell>
                <TableCell>
                  {payout.createdAt 
                    ? format(new Date(payout.createdAt), "MMM d, yyyy") 
                    : "N/A"}
                </TableCell>
                <TableCell>{getStatusBadge(payout.status)}</TableCell>
                <TableCell className="font-medium">
                  ${parseFloat(payout.amount).toFixed(2)}
                </TableCell>
                <TableCell>{formatPaymentMethod(payout.paymentMethod)}</TableCell>
                {isAdmin && <TableCell>{payout.vendorId}</TableCell>}
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleView(payout)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default VendorPayouts;