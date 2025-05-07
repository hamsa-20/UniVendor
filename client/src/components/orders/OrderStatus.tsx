import { Badge } from "@/components/ui/badge";
import { FC } from "react";

type OrderStatusType = "pending" | "processing" | "shipped" | "delivered" | "canceled";

interface OrderStatusProps {
  status: OrderStatusType;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<OrderStatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "secondary" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  canceled: { label: "Canceled", variant: "destructive" },
};

// Extend Badge variants to include success and warning
const getVariantClass = (variant: string) => {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100";
    case "warning":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100";
    default:
      return "";
  }
};

export const OrderStatus: FC<OrderStatusProps> = ({ status, size = "md" }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "px-3 py-1"
  }[size];

  // For custom variants, apply custom classes
  const isCustomVariant = ["success", "warning"].includes(config.variant);
  
  if (isCustomVariant) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${getVariantClass(config.variant)}`}>
        {config.label}
      </span>
    );
  }
  
  return (
    <Badge variant={config.variant as any} className={sizeClass}>
      {config.label}
    </Badge>
  );
};

export default OrderStatus;