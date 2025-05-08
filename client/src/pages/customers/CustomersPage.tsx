import React from "react";
import { Helmet } from "react-helmet";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorStore } from "@/contexts/VendorStoreContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, UserCheck, UserX, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { activeVendor } = useVendorStore();
  const { toast } = useToast();

  // This would be a React Query hook in a real implementation
  const customers = [
    {
      id: 1,
      firstName: "Alex",
      lastName: "Johnson",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 123-4567",
      status: "active",
      totalOrders: 5,
      totalSpent: 450.75,
      lastOrder: "2023-04-15",
    },
    {
      id: 2,
      firstName: "Samantha",
      lastName: "Williams",
      email: "samantha.w@example.com",
      phone: "+1 (555) 987-6543",
      status: "inactive",
      totalOrders: 2,
      totalSpent: 129.99,
      lastOrder: "2023-02-28",
    },
    {
      id: 3,
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@example.com",
      phone: "+1 (555) 456-7890",
      status: "active",
      totalOrders: 8,
      totalSpent: 789.50,
      lastOrder: "2023-04-29",
    },
  ];

  const addNewCustomer = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Adding new customers will be available in a future update.",
    });
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Customers | {activeVendor?.companyName || "MultiVend"}</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={addNewCustomer}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Customer Management</CardTitle>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center w-full max-w-sm relative">
              <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-9 w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Active: 2
              </Badge>
              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                Inactive: 1
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                Total: 3
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        customer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {customer.status === "active" ? (
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <UserX className="h-3.5 w-3.5 mr-1" />
                      )}
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>₹{customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(customer.lastOrder).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit customer</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CustomersPage;