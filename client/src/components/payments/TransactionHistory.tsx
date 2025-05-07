import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  createdAt: Date | null;
  type: string;
  status: string;
  amount: string;
  fee: string;
  net: string;
  currency: string | null;
  orderId: number | null;
  paymentMethodId: number | null;
  invoiceId: number | null;
  vendorId: number;
  metadata?: any;
  // For refunds
  refundedAmount?: string | null;
  refundReason?: string | null;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  title?: string;
  showVendorColumn?: boolean;
  isLoading?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  title = "Transaction History",
  showVendorColumn = false,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });

  // Handle filtering
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filter !== "all" && transaction.type !== filter) {
      return false;
    }

    // Filter by search query (transaction ID or order ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const idMatch = transaction.id.toString().includes(query);
      const orderIdMatch = transaction.orderId
        ? transaction.orderId.toString().includes(query)
        : false;
      const amountMatch = transaction.amount.includes(query);
      
      if (!idMatch && !orderIdMatch && !amountMatch) {
        return false;
      }
    }

    // Filter by date range
    if (dateRange.from && transaction.createdAt && new Date(transaction.createdAt) < dateRange.from) {
      return false;
    }
    if (dateRange.to && transaction.createdAt && new Date(transaction.createdAt) > dateRange.to) {
      return false;
    }

    return true;
  });

  // Handle sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const key = sortConfig.key;
    
    if (key === "createdAt") {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    if (key === "amount" || key === "fee" || key === "net") {
      const numA = parseFloat(a[key] || "0");
      const numB = parseFloat(b[key] || "0");
      return sortConfig.direction === "asc" ? numA - numB : numB - numA;
    }
    
    // For string values
    const valueA = a[key] || "";
    const valueB = b[key] || "";
    
    if (sortConfig.direction === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });

  // Handle sort request
  const requestSort = (key: keyof Transaction) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Generate CSV for export
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Status",
      "Amount",
      "Fee",
      "Net",
      "Currency",
      "Order ID",
      showVendorColumn ? "Vendor ID" : "",
    ].filter(Boolean).join(",");

    const csvRows = sortedTransactions.map((t) => {
      const row = [
        t.id,
        t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm:ss") : "",
        t.type,
        t.status,
        t.amount,
        t.fee,
        t.net,
        t.currency || "USD",
        t.orderId || "",
        showVendorColumn ? t.vendorId : "",
      ].filter((_, i) => !showVendorColumn || i !== 9).join(",");
      return row;
    });

    const csvContent = [headers, ...csvRows].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Create filename with current date
    const date = format(new Date(), "yyyy-MM-dd");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${date}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case "order_payment":
        return "Order Payment";
      case "refund":
        return "Refund";
      case "payout":
        return "Payout";
      case "platform_subscription":
        return "Subscription";
      case "fee":
        return "Fee";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="font-medium">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="font-medium">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="font-medium">
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="secondary" className="font-medium">
            Refunded
          </Badge>
        );
      case "partial_refund":
        return (
          <Badge variant="warning" className="font-medium">
            Partial Refund
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium">
            {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="order_payment">Order Payments</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="payout">Payouts</SelectItem>
                <SelectItem value="platform_subscription">Subscriptions</SelectItem>
                <SelectItem value="fee">Fees</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ID or amount..."
                className="w-full pl-8 sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal sm:w-[250px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) =>
                    setDateRange({
                      from: range?.from || null,
                      to: range?.to || null,
                    })
                  }
                  initialFocus
                />
                <div className="flex justify-end gap-2 p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ from: null, to: null })}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">No transactions found</p>
            {(filter !== "all" || searchQuery || dateRange.from || dateRange.to) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                  setDateRange({ from: null, to: null });
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort("id")}
                  >
                    ID
                    <ArrowUpDown className={cn(
                      "ml-1 h-3 w-3 inline",
                      sortConfig.key === "id" ? "opacity-100" : "opacity-30"
                    )} />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort("createdAt")}
                  >
                    Date
                    <ArrowUpDown className={cn(
                      "ml-1 h-3 w-3 inline",
                      sortConfig.key === "createdAt" ? "opacity-100" : "opacity-30"
                    )} />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort("type")}
                  >
                    Type
                    <ArrowUpDown className={cn(
                      "ml-1 h-3 w-3 inline",
                      sortConfig.key === "type" ? "opacity-100" : "opacity-30"
                    )} />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort("amount")}
                  >
                    Amount
                    <ArrowUpDown className={cn(
                      "ml-1 h-3 w-3 inline",
                      sortConfig.key === "amount" ? "opacity-100" : "opacity-30"
                    )} />
                  </TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net</TableHead>
                  {showVendorColumn && <TableHead>Vendor</TableHead>}
                  <TableHead>Order ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>
                      {transaction.createdAt 
                        ? format(new Date(transaction.createdAt), "MMM d, yyyy") 
                        : "N/A"}
                    </TableCell>
                    <TableCell>{formatTransactionType(transaction.type)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className={cn(
                      "font-medium", 
                      (transaction.type === "refund" || transaction.type === "payout") ? "text-red-600" : ""
                    )}>
                      {transaction.type === "refund" || transaction.type === "payout" ? "-" : ""}
                      ${parseFloat(transaction.amount).toFixed(2)}
                      {transaction.currency && transaction.currency !== "USD" ? ` ${transaction.currency}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${parseFloat(transaction.fee).toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "font-medium", 
                      (transaction.type === "refund" || transaction.type === "payout") ? "text-red-600" : ""
                    )}>
                      {transaction.type === "refund" || transaction.type === "payout" ? "-" : ""}
                      ${parseFloat(transaction.net).toFixed(2)}
                    </TableCell>
                    {showVendorColumn && (
                      <TableCell>{transaction.vendorId}</TableCell>
                    )}
                    <TableCell>
                      {transaction.orderId || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;