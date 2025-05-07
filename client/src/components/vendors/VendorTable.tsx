import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type VendorTableProps = {
  onAddVendor: () => void;
  onEditVendor: (id: number) => void;
  onDeleteVendor: (id: number) => void;
};

const VendorTable = ({ onAddVendor, onEditVendor, onDeleteVendor }: VendorTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
  });

  // Filter vendors based on search query and filters
  const filteredVendors = vendors
    ? vendors.filter((vendor) => {
        // Search filter
        const searchMatch =
          vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.user?.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const statusMatch = statusFilter === 'all' || vendor.status === statusFilter;

        // Plan filter
        const planMatch =
          planFilter === 'all' ||
          (vendor.subscriptionPlan && vendor.subscriptionPlan.name.toLowerCase() === planFilter.toLowerCase());

        return searchMatch && statusMatch && planMatch;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / perPage);
  const paginatedVendors = filteredVendors.slice((page - 1) * perPage, page * perPage);

  // Badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>Manage all vendors on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
            <Skeleton className="h-10 w-full md:w-64" />
            <Skeleton className="h-10 w-40" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 w-full md:flex-1" />
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full sm:w-40" />
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Revenue</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Domains</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4 align-middle"><Skeleton className="h-4 w-12" /></td>
                      <td className="p-4 align-middle"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-4 align-middle"><Skeleton className="h-4 w-8" /></td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>Manage all vendors on your platform</CardDescription>
        </div>
        <Button onClick={onAddVendor}>
          <Store className="mr-2 h-4 w-4" />
          Add New Vendor
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={setPlanFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendors table */}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Revenue</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Domains</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {paginatedVendors.length > 0 ? (
                  paginatedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          {vendor.logoUrl ? (
                            <img
                              src={vendor.logoUrl}
                              alt={vendor.companyName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                              <span className="text-primary font-medium">
                                {vendor.companyName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{vendor.companyName}</p>
                            <p className="text-xs text-muted-foreground">{vendor.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={getStatusBadgeVariant(vendor.status)}>
                          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {vendor.subscriptionPlan?.name || 'Free'}
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        ${Math.floor(Math.random() * 10000)} {/* This would be actual revenue data */}
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {vendor.domains?.length || 0}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/vendors/${vendor.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onEditVendor(vendor.id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteVendor(vendor.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No vendors found. Adjust filters or add a new vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * perPage + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(page * perPage, filteredVendors.length)}
              </span>{" "}
              of <span className="font-medium">{filteredVendors.length}</span> vendors
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorTable;
