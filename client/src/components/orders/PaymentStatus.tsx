import { Badge } from "@/components/ui/badge";
import { FC } from "react";

type PaymentStatusType = "pending" | "paid" | "failed" | "refunded";

interface PaymentStatusProps {
  status: PaymentStatusType;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<PaymentStatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending: { label: "Pending", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
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

export const PaymentStatus: FC<PaymentStatusProps> = ({ status, size = "md" }) => {
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

export default PaymentStatus;