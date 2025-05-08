import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar backdrop for mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-30 z-20 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar component */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={toggleSidebar} 
      />
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <Header 
          onToggleSidebar={toggleSidebar} 
          title={title}
          subtitle={subtitle}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
