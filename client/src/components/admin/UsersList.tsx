import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { UserImpersonation } from './UserImpersonation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Fetch users data
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter users based on search term
  const filteredUsers = users 
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];
    
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Users</h2>
          <div className="relative w-64">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-500">
        Error loading users: {error.message}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users ({filteredUsers.length})</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 w-64"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'super_admin' ? (
                      <Badge variant="destructive">Super Admin</Badge>
                    ) : user.role === 'admin' ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Vendor</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? (
                      <span title={new Date(user.createdAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    ) : (
                      'Unknown'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <UserImpersonation userId={user.id} userEmail={user.email} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-more-horizontal"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Show only limited page numbers to avoid clutter
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return <PaginationItem key={pageNumber}>...</PaginationItem>;
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}