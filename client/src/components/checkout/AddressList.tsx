import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Check, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddressForm } from "./AddressForm";

interface CustomerAddress {
  id: number;
  customerId: number;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean | null;
  createdAt: string;
}

interface AddressListProps {
  vendorId: number;
  onAddressSelect: (address: CustomerAddress | null) => void;
  selectedAddressId?: number | null;
}

export function AddressList({ vendorId, onAddressSelect, selectedAddressId }: AddressListProps) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Fetch addresses
  const { data: addresses, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/addresses', vendorId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/addresses?vendorId=${vendorId}`);
      const data = await res.json();
      return data as CustomerAddress[];
    }
  });
  
  // Delete address mutation
  const deleteAddress = useMutation({
    mutationFn: async (addressId: number) => {
      await apiRequest('DELETE', `/api/addresses/${addressId}?vendorId=${vendorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', vendorId] });
      toast({
        title: "Address deleted",
        description: "The address has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  // Set default address mutation
  const setDefaultAddress = useMutation({
    mutationFn: async (addressId: number) => {
      const res = await apiRequest('POST', `/api/addresses/${addressId}/set-default`, { vendorId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', vendorId] });
      toast({
        title: "Default address updated",
        description: "Your default address has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  // Automatically select default address on load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      onAddressSelect(defaultAddress);
    }
  }, [addresses, selectedAddressId, onAddressSelect]);

  // Handle adding/editing address completion
  const handleAddressFormComplete = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    refetch();
  };

  // Handle address selection
  const handleAddressSelect = (address: CustomerAddress) => {
    onAddressSelect(address);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-6 text-red-500">
        Failed to load addresses. Please try again.
      </div>
    );
  }

  if (showAddForm || editingAddress) {
    return (
      <AddressForm 
        vendorId={vendorId} 
        onComplete={handleAddressFormComplete} 
        onCancel={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
        addressData={editingAddress || undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Addresses</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Address
        </Button>
      </div>

      {addresses && addresses.length > 0 ? (
        <RadioGroup 
          value={selectedAddressId?.toString() || ''} 
          onValueChange={(value) => {
            const selected = addresses.find(addr => addr.id.toString() === value);
            if (selected) handleAddressSelect(selected);
          }}
          className="space-y-4"
        >
          {addresses.map((address) => (
            <Card 
              key={address.id} 
              className={`overflow-hidden ${address.isDefault ? 'border-primary' : ''}`}
            >
              <div className="flex items-start p-4">
                <RadioGroupItem 
                  value={address.id.toString()} 
                  id={`address-${address.id}`} 
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {address.addressLine1}
                        {address.isDefault && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      {address.addressLine2 && <p className="text-sm">{address.addressLine2}</p>}
                      <p className="text-sm">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm">{address.country}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingAddress(address);
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      {!address.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setDefaultAddress.mutate(address.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Are you sure you want to delete this address?")) {
                            deleteAddress.mutate(address.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </RadioGroup>
      ) : (
        <div className="text-center p-6 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No saved addresses found.</p>
          <p className="text-sm text-muted-foreground mt-1">Add a new address to continue.</p>
        </div>
      )}
    </div>
  );
}