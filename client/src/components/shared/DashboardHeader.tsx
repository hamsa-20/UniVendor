import { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

const DashboardHeader = ({ title, description, action }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};

export default DashboardHeader;