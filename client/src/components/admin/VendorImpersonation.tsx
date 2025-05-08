import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function VendorImpersonation() {
  const { user, isImpersonating, impersonateUserMutation, stopImpersonatingMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Only super_admins can impersonate
  if (user?.role !== 'super_admin') {
    return null;
  }
  
  // Fetch all vendors (users with role 'vendor')
  const { data: vendors, isLoading } = useQuery<any[]>({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      if (!res.ok) {
        throw new Error('Failed to fetch vendors');
      }
      return res.json();
    },
    // Don't refetch too often
    staleTime: 1000 * 60 * 5,
  });
  
  // Filter vendors by search term
  const filteredVendors = vendors ? vendors.filter(vendor => 
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.firstName && vendor.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vendor.lastName && vendor.lastName.toLowerCase().includes(searchTerm.toLowerCase())) 
  ) : [];
  
  // Handle impersonation action
  const handleImpersonate = (vendorId: number) => {
    impersonateUserMutation.mutate({ userId: vendorId });
  };
  
  // Handle stop impersonation action
  const handleStopImpersonation = () => {
    stopImpersonatingMutation.mutate();
  };
  
  if (isImpersonating) {
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Impersonation Mode Active</AlertTitle>
        <AlertDescription className="text-amber-700">
          You are currently impersonating a vendor account. 
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 bg-white border-amber-300" 
            onClick={handleStopImpersonation}
            disabled={stopImpersonatingMutation.isPending}
          >
            {stopImpersonatingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Return to Admin Account
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Impersonation</CardTitle>
        <CardDescription>
          Impersonate a vendor account to troubleshoot issues or assist them with their store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search vendors..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
          </div>
        ) : vendors && vendors.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      {vendor.firstName && vendor.lastName 
                        ? `${vendor.firstName} ${vendor.lastName}`
                        : 'Unnamed Vendor'}
                    </TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                      <Badge variant={vendor.isProfileComplete ? "success" : "secondary"}>
                        {vendor.isProfileComplete ? 'Active' : 'Incomplete'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonate(vendor.id)}
                        disabled={impersonateUserMutation.isPending}
                      >
                        {impersonateUserMutation.isPending && impersonateUserMutation.variables?.userId === vendor.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <UserCheck className="h-4 w-4 mr-2" />
                        Impersonate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">No vendors found</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <p className="text-xs text-gray-500">
          Warning: Impersonation gives you full access to the vendor's account. All actions will appear as if performed by the vendor.
        </p>
      </CardFooter>
    </Card>
  );
}