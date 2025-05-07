import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction } from "@shared/schema";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.gatewayTransactionId?.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower);
      
      // Type filter
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  
  // Get unique types and statuses for filters
  const transactionTypes = Array.from(new Set(transactions.map(t => t.type)));
  const transactionStatuses = Array.from(new Set(transactions.map(t => t.status)));
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      case "partial_refund":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "order_payment":
        return "bg-blue-100 text-blue-800";
      case "refund":
        return "bg-purple-100 text-purple-800";
      case "platform_subscription":
        return "bg-indigo-100 text-indigo-800";
      case "payout":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-3">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {transactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {transactionStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Sort
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={sortOrder === "desc"}
                onCheckedChange={() => setSortOrder("desc")}
              >
                Newest first
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === "asc"}
                onCheckedChange={() => setSortOrder("asc")}
              >
                Oldest first
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Transactions table */}
      {filteredTransactions.length > 0 ? (
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Fee</th>
                <th className="px-6 py-3">Net</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{formatDate(transaction.createdAt)}</td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {transaction.gatewayTransactionId?.substring(0, 12) || 
                     transaction.orderId ? `Order #${transaction.orderId}` : 
                     transaction.invoiceId ? `Invoice #${transaction.invoiceId}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="outline" 
                      className={getTypeColor(transaction.type)}
                    >
                      {transaction.type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(transaction.status)}
                    >
                      {transaction.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    -{formatCurrency(transaction.fee)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(transaction.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          No transactions found matching your filters
        </Card>
      )}
    </div>
  );
};

export default TransactionHistory;