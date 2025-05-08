import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersList } from "@/components/admin/UsersList";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not a super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== "super_admin") {
    return null; // Don't render anything while redirecting
  }

  return (
    <DashboardLayout 
      title="User Management" 
      subtitle="Manage all users across the platform"
    >
      <div className="container py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="all-users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="super-admins">Super Admins</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-users">
            <UsersList filter="all" />
          </TabsContent>
          
          <TabsContent value="super-admins">
            <UsersList filter="super_admin" />
          </TabsContent>
          
          <TabsContent value="vendors">
            <UsersList filter="vendor" />
          </TabsContent>
          
          <TabsContent value="customers">
            <UsersList filter="customer" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}