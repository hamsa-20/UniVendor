import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
  isLoading?: boolean;
  onDateRangeChange?: (range: string) => void;
  onViewTypeChange?: (viewType: string) => void;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  title = "Revenue Overview", 
  isLoading = false,
  onDateRangeChange,
  onViewTypeChange
}) => {
  const [activeDataKey, setActiveDataKey] = useState<"revenue" | "orders">("revenue");
  const [dateRange, setDateRange] = useState<string>("30d");
  const [viewType, setViewType] = useState<string>("daily");

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (onDateRangeChange) {
      onDateRangeChange(value);
    }
  };

  const handleViewTypeChange = (value: string) => {
    setViewType(value);
    if (onViewTypeChange) {
      onViewTypeChange(value);
    }
  };

  const formatYAxis = (value: number) => {
    if (activeDataKey === "revenue") {
      return `$${value.toFixed(0)}`;
    }
    return value.toString();
  };

  const formatTooltip = (value: number) => {
    if (activeDataKey === "revenue") {
      return [`$${value.toFixed(2)}`, "Revenue"];
    }
    return [value.toString(), "Orders"];
  };

  const formatDate = (dateStr: string) => {
    // Handle different date formats based on viewType
    if (viewType === "daily") {
      // Format: 2023-01-01
      return format(new Date(dateStr), "MMM d");
    }
    if (viewType === "weekly") {
      // Format: 2023-W01
      const [year, week] = dateStr.split("-W");
      return `Week ${week}`;
    }
    if (viewType === "monthly") {
      // Format: 2023-01
      const [year, month] = dateStr.split("-");
      return format(new Date(`${year}-${month}-01`), "MMM yyyy");
    }
    return dateStr;
  };

  const getChartColor = () => {
    return activeDataKey === "revenue" ? "#3b82f6" : "#10b981";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex space-x-2">
          <Select value={activeDataKey} onValueChange={(value) => setActiveDataKey(value as "revenue" | "orders")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={handleViewTypeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-muted-foreground mb-4">No revenue data available for this period</p>
            <Button variant="outline" onClick={() => handleDateRangeChange("year")}>
              View Full Year
            </Button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={formatTooltip} 
                labelFormatter={(label) => formatDate(label)}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={getChartColor()} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={activeDataKey}
                stroke={getChartColor()}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;