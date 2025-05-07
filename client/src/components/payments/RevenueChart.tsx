import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-3 border shadow-sm bg-white">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-gray-800">
          Revenue: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-gray-800">
          Orders: {payload[1].value}
        </p>
      </Card>
    );
  }

  return null;
};

const RevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          yAxisId="revenue"
          orientation="left" 
          tick={{ fontSize: 12, fill: '#6B7280' }} 
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <YAxis 
          yAxisId="orders"
          orientation="right" 
          tick={{ fontSize: 12, fill: '#6B7280' }} 
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#6366F1"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          activeDot={{ r: 6 }}
        />
        <Area
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="#22C55E"
          strokeWidth={2}
          fill="url(#colorOrders)"
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;