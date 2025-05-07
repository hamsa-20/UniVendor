import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  AlertCircle
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

type DomainTableProps = {
  vendorId?: number;
  onAddDomain: () => void;
  onEditDomain: (id: number) => void;
  onDeleteDomain: (id: number) => void;
};

const DomainTable = ({ vendorId, onAddDomain, onEditDomain, onDeleteDomain }: DomainTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Fetch domains - either all domains or domains for a specific vendor
  const { data: domains, isLoading } = useQuery({
    queryKey: vendorId ? ['/api/vendors', vendorId, 'domains'] : ['/api/domains'],
  });

  // Filter domains based on search query and filters
  const filteredDomains = domains
    ? domains.filter((domain) => {
        // Search filter
        const searchMatch = domain.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const statusMatch = statusFilter === 'all' || domain.status === statusFilter;

        // Type filter
        const typeMatch = typeFilter === 'all' || domain.type === typeFilter;

        return searchMatch && statusMatch && typeMatch;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / perPage);
  const paginatedDomains = filteredDomains.slice((page - 1) * perPage, page * perPage);

  // Status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'secondary';
    }
  };

  // SSL status icon and text
  const getSslStatus = (status: string) => {
    switch (status) {
      case 'valid':
        return {
          icon: <Lock className="h-4 w-4 text-green-500 mr-1" />,
          text: 'Secure',
          className: 'text-green-500',
        };
      case 'pending':
        return {
          icon: <Lock className="h-4 w-4 text-yellow-500 mr-1" />,
          text: 'Pending',
          className: 'text-yellow-500',
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500 mr-1" />,
          text: 'Not Secure',
          className: 'text-red-500',
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Management</CardTitle>
          <CardDescription>Manage all domains connected to vendor stores</CardDescription>
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
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Domain</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SSL</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Expiration</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-24" />
                      </td>
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
          <CardTitle>Domain Management</CardTitle>
          <CardDescription>
            {vendorId 
              ? "Manage domains for this vendor" 
              : "Manage all domains connected to vendor stores"}
          </CardDescription>
        </div>
        <Button onClick={onAddDomain}>
          <Globe className="mr-2 h-4 w-4" />
          Add New Domain
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
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
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subdomain">Subdomain</SelectItem>
                <SelectItem value="custom">Custom Domain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Domains table */}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Domain</th>
                  {!vendorId && (
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                  )}
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SSL</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Expiration</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {paginatedDomains.length > 0 ? (
                  paginatedDomains.map((domain) => {
                    const sslStatus = getSslStatus(domain.sslStatus);
                    
                    return (
                      <tr
                        key={domain.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="font-medium">{domain.name}</span>
                            {domain.isPrimary && (
                              <Badge variant="secondary" className="ml-2">Primary</Badge>
                            )}
                          </div>
                        </td>
                        {!vendorId && (
                          <td className="p-4 align-middle text-sm">
                            {domain.vendor?.companyName || "Unknown Vendor"}
                          </td>
                        )}
                        <td className="p-4 align-middle text-sm capitalize">
                          {domain.type}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={getStatusBadgeVariant(domain.status)}>
                            {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          <div className={`flex items-center ${sslStatus.className}`}>
                            {sslStatus.icon}
                            <span>{sslStatus.text}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">
                          {new Date(domain.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.location.href = `/domains/${domain.id}`}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => onEditDomain(domain.id)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => onDeleteDomain(domain.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={vendorId ? 6 : 7} className="p-4 text-center text-muted-foreground">
                      No domains found. Adjust filters or add a new domain.
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
                {Math.min(page * perPage, filteredDomains.length)}
              </span>{" "}
              of <span className="font-medium">{filteredDomains.length}</span> domains
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

export default DomainTable;
