import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Order } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema for order updates
const updateSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  notes: z.string().optional(),
});

interface OrderUpdateFormProps {
  order: Order;
  onSuccess?: () => void;
}

type UpdateFormValues = z.infer<typeof updateSchema>;

const OrderUpdateForm = ({ order, onSuccess }: OrderUpdateFormProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create form
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
      notes: order.notes || '',
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFormValues) => {
      const response = await apiRequest('PATCH', `/api/orders/${order.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${order.vendorId}/orders`] });
      
      toast({
        title: 'Order Updated',
        description: 'The order has been successfully updated.',
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleSubmit = (values: UpdateFormValues) => {
    // Update status-related dates based on new status
    const updateData: any = { ...values };
    
    if (values.status && values.status !== order.status) {
      setIsUpdatingStatus(true);
      
      // Reset all status dates
      updateData.processingDate = null;
      updateData.shippedDate = null;
      updateData.deliveredDate = null;
      updateData.canceledDate = null;
      
      // Set the appropriate date based on new status
      const now = new Date().toISOString();
      
      if (values.status === 'processing') {
        updateData.processingDate = now;
      } else if (values.status === 'shipped') {
        updateData.processingDate = order.processingDate || now;
        updateData.shippedDate = now;
      } else if (values.status === 'delivered') {
        updateData.processingDate = order.processingDate || now;
        updateData.shippedDate = order.shippedDate || now;
        updateData.deliveredDate = now;
      } else if (values.status === 'canceled') {
        updateData.canceledDate = now;
      }
    }
    
    updateMutation.mutate(updateData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order</CardTitle>
        <CardDescription>
          Update order status, tracking information, and notes
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tracking number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about this order"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex items-center"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default OrderUpdateForm;