// This component will be properly implemented 
// once PayPal credentials are added

import { Button } from "@/components/ui/button";
import { SiPaypal } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

const PayPalButton = ({ amount, currency, intent }: PayPalButtonProps) => {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: "PayPal Setup Required",
      description: "PayPal payment processing requires API credentials. Please add them in the settings.",
      variant: "destructive"
    });
  };
  
  return (
    <Button 
      onClick={handleClick}
      className="w-full bg-[#0070ba] hover:bg-[#003087] flex items-center justify-center"
    >
      <SiPaypal className="h-5 w-5 mr-2" />
      <span>Pay with PayPal</span>
    </Button>
  );
};

export default PayPalButton;