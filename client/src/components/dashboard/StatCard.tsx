import { ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
    text?: string;
  };
  className?: string;
};

const StatCard = ({ title, value, icon, change, className }: StatCardProps) => {
  return (
    <div className={cn("bg-white overflow-hidden rounded-lg shadow", className)}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className={cn(
              "font-medium flex items-center",
              change.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {change.isPositive ? 
                <ArrowUpIcon className="mr-1 h-4 w-4" /> : 
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              }
              {change.value}%
              {change.text && <span className="text-gray-500 ml-2">{change.text}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
