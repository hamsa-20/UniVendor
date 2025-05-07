import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import { Order } from '@shared/schema';
import {
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  File
} from 'lucide-react';

interface OrderTimelineProps {
  order: Order;
}

interface TimelineEvent {
  name: string;
  icon: React.ReactNode;
  color: string;
  date: Date | null;
  description: string;
}

const OrderTimeline = ({ order }: OrderTimelineProps) => {
  // Create timeline events based on order status
  const events: TimelineEvent[] = [
    {
      name: 'Order Placed',
      icon: <File />,
      color: 'text-gray-600 bg-gray-100',
      date: order.createdAt ? new Date(order.createdAt) : null,
      description: `Order #${order.orderNumber} was placed`
    },
    {
      name: 'Processing',
      icon: <PackageCheck />,
      color: 'text-blue-600 bg-blue-100',
      date: order.processingDate ? new Date(order.processingDate) : null,
      description: 'Order is being processed'
    },
    {
      name: 'Shipped',
      icon: <Truck />,
      color: 'text-purple-600 bg-purple-100',
      date: order.shippedDate ? new Date(order.shippedDate) : null,
      description: order.trackingNumber 
        ? `Shipped with tracking: ${order.trackingNumber}` 
        : 'Order has been shipped'
    },
    {
      name: 'Delivered',
      icon: <CheckCircle2 />,
      color: 'text-green-600 bg-green-100',
      date: order.deliveredDate ? new Date(order.deliveredDate) : null,
      description: 'Order has been delivered'
    }
  ];

  // Add canceled event if order is canceled
  if (order.status === 'canceled') {
    events.push({
      name: 'Canceled',
      icon: <XCircle />,
      color: 'text-red-600 bg-red-100',
      date: order.canceledDate ? new Date(order.canceledDate) : null,
      description: order.cancellationReason || 'Order was canceled'
    });
  }

  // Filter out events with no date (haven't occurred yet)
  // Then sort them by date
  const sortedEvents = events
    .filter(event => event.date !== null)
    .sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0));

  // No events to show (should never happen as created date should always exist)
  if (sortedEvents.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <Clock className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p>No order history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <h3 className="text-lg font-medium">Order Timeline</h3>
      <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3 before:ml-px before:border-l-2 before:border-gray-200">
        {sortedEvents.map((event, index) => (
          <div key={index} className="relative">
            <div className={cn(
              'absolute left-0 mt-1.5 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center',
              event.color
            )}>
              {event.icon}
            </div>
            <div className="text-sm">
              <div className="font-semibold flex items-center">
                {event.name}
                <span className="text-gray-500 font-normal ml-2">
                  {event.date && formatDateTime(event.date)}
                </span>
              </div>
              <div className="mt-0.5 text-gray-600">
                {event.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTimeline;