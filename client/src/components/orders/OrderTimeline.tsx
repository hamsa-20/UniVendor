import { FC } from 'react';
import { CheckCircle2, Clock, Package, Truck, ShoppingBag, XCircle } from 'lucide-react';

export type OrderStatusType = 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';

interface OrderTimelineProps {
  status: OrderStatusType;
  canceledAt?: Date;
  processingAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

interface TimelineStep {
  id: OrderStatusType;
  name: string;
  icon: JSX.Element;
  description: string;
}

export const OrderTimeline: FC<OrderTimelineProps> = ({
  status,
  canceledAt,
  processingAt,
  shippedAt,
  deliveredAt,
}) => {
  
  // Define the timeline steps
  const steps: TimelineStep[] = [
    {
      id: 'pending',
      name: 'Order Placed',
      icon: <ShoppingBag className="h-5 w-5" />,
      description: 'Your order has been received',
    },
    {
      id: 'processing',
      name: 'Processing',
      icon: <Package className="h-5 w-5" />,
      description: 'Your order is being prepared',
    },
    {
      id: 'shipped',
      name: 'Shipped',
      icon: <Truck className="h-5 w-5" />,
      description: 'Your order is on the way',
    },
    {
      id: 'delivered',
      name: 'Delivered',
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: 'Your order has been delivered',
    },
  ];

  // If order is canceled, show a different timeline
  if (status === 'canceled') {
    return (
      <div className="p-4 border rounded-md bg-red-50">
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="font-semibold text-lg text-red-700">Order Canceled</h3>
            <p className="text-red-600 text-sm">
              {canceledAt
                ? `This order was canceled on ${canceledAt.toLocaleDateString()}`
                : 'This order has been canceled'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <div className="p-4 border rounded-md bg-white">
      <ol className="relative border-l border-gray-200 ml-3">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isPending = index === currentStepIndex + 1;
          const isCompleted = index < currentStepIndex;
          
          let date: Date | undefined;
          if (step.id === 'pending') date = undefined;
          else if (step.id === 'processing') date = processingAt;
          else if (step.id === 'shipped') date = shippedAt;
          else if (step.id === 'delivered') date = deliveredAt;

          return (
            <li key={step.id} className="mb-6 ml-6">
              <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white
                ${isActive ? 'bg-blue-500 text-white' : isPending ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                {step.icon}
              </span>
              <h3 className={`flex items-center mb-1 text-lg font-semibold
                ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.name}
                {isCompleted && (
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3">
                    Completed
                  </span>
                )}
              </h3>
              <time className={`block mb-2 text-sm font-normal leading-none
                ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                {date ? date.toLocaleString() : isPending ? 'Pending' : 'Not started'}
              </time>
              <p className={`mb-4 text-base font-normal
                ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default OrderTimeline;