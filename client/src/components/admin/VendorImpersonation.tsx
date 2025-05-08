import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogIn, Search } from 'lucide-react';

export function VendorImpersonation() {
  const { user, impersonateUserMutation } = useAuth();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/vendors');
        if (!res.ok) throw new Error('Failed to fetch vendors');
        return await res.json();
      } catch (error) {
        console.error('Error fetching vendors:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'super_admin'
  });

  // Filter vendors based on search query
  const filteredVendors = vendors.filter((vendor: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vendor.email?.toLowerCase().includes(searchLower) ||
      vendor.firstName?.toLowerCase().includes(searchLower) ||
      vendor.lastName?.toLowerCase().includes(searchLower) ||
      vendor.storeName?.toLowerCase().includes(searchLower)
    );
  });

  const handleImpersonate = (userId: number) => {
    impersonateUserMutation.mutate({ userId }, {
      onSuccess: () => {
        setLocation('/dashboard');
      }
    });
  };

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Impersonation</CardTitle>
        <CardDescription>Log in as a vendor to troubleshoot or assist with their store</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search vendors by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No vendors found with that search criteria
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor: any) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between p-4 rounded-md border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={vendor.avatarUrl || ''} alt={vendor.firstName} />
                    <AvatarFallback>
                      {vendor.firstName?.charAt(0) || ''}
                      {vendor.lastName?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {vendor.firstName} {vendor.lastName}
                      {vendor.storeName && <span className="text-primary"> • {vendor.storeName}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImpersonate(vendor.id)}
                  disabled={impersonateUserMutation.isPending}
                >
                  {impersonateUserMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Impersonate
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}