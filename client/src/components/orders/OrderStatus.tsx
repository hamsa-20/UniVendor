import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Truck, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

type OrderStatusProps = {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
};

const OrderStatus = ({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: OrderStatusProps) => {
  // Define statuses with their respective colors and icons
  const statuses: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: <Clock className="h-4 w-4" />,
      label: 'Pending'
    },
    processing: {
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: <PackageCheck className="h-4 w-4" />,
      label: 'Processing'
    },
    shipped: {
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      icon: <Truck className="h-4 w-4" />,
      label: 'Shipped'
    },
    delivered: {
      color: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Delivered'
    },
    canceled: {
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: <XCircle className="h-4 w-4" />,
      label: 'Canceled'
    }
  };

  // Set fallback for unknown statuses
  const statusConfig = statuses[status.toLowerCase()] || {
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    icon: <AlertCircle className="h-4 w-4" />,
    label: status
  };

  // Size variations
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        statusConfig.color, 
        sizeStyles[size],
        'font-medium border-0',
        className
      )}
    >
      {showIcon && <span className="mr-1.5">{statusConfig.icon}</span>}
      {statusConfig.label}
    </Badge>
  );
};

export default OrderStatus;