import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, ExternalLink, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type DNSRecord = {
  type: string;
  name: string;
  value: string;
};

interface DomainVerificationProps {
  domain: {
    id: number;
    name: string;
    type: string;
    status: string;
    verificationStatus: string;
    verificationToken?: string;
  };
}

export function DomainVerification({ domain }: DomainVerificationProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch DNS records
  const fetchDnsRecordsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/domains/${domain.id}/dns-records`);
      return response.json();
    },
    onSuccess: () => {
      setShowInstructions(true);
      toast({
        title: "DNS records retrieved",
        description: "Please follow the instructions to verify your domain",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to retrieve DNS records",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate verification token
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/domains/${domain.id}/generate-token`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/domains", domain.id], data);
      fetchDnsRecordsMutation.mutate();
      toast({
        title: "Verification token generated",
        description: "A new verification token has been generated for your domain",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate verification token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify domain
  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/domains/${domain.id}/verify`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/domains", domain.id], data);
      toast({
        title: "Domain verified successfully",
        description: "Your domain has been verified and is now active",
      });
      setShowInstructions(false);
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The value has been copied to your clipboard",
    });
  };

  // Render verification status badge
  const renderStatusBadge = () => {
    switch (domain.verificationStatus) {
      case "verified":
        return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Verification</Badge>;
      case "failed":
        return <Badge className="bg-red-500 hover:bg-red-600">Verification Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Not Verified</Badge>;
    }
  };

  // If it's a subdomain, no verification needed
  if (domain.type === "subdomain") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Domain Verification</h3>
        <Alert>
          <AlertTitle>No verification needed</AlertTitle>
          <AlertDescription>
            Subdomains are automatically verified and do not require DNS configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-lg font-medium">Domain Verification</h3>
        {renderStatusBadge()}
      </div>

      {domain.verificationStatus === "verified" ? (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle>Domain Verified</AlertTitle>
          <AlertDescription>
            Your domain has been successfully verified and is active.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              Your domain needs to be verified before it can be used. Please follow the instructions below.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-2">
            <Button 
              onClick={() => generateTokenMutation.mutate()} 
              disabled={generateTokenMutation.isPending || fetchDnsRecordsMutation.isPending}
            >
              {generateTokenMutation.isPending ? "Generating..." : "Generate Verification Token"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => verifyDomainMutation.mutate()} 
              disabled={verifyDomainMutation.isPending || !domain.verificationToken}
            >
              {verifyDomainMutation.isPending ? "Verifying..." : "Verify Domain"}
            </Button>
          </div>

          {showInstructions && fetchDnsRecordsMutation.data && (
            <Card className="p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">DNS Configuration Instructions</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Add the following DNS records to your domain registrar. Once added, click "Verify Domain" to confirm.
                </p>
                
                <div className="space-y-4">
                  {fetchDnsRecordsMutation.data.map((record: DNSRecord, index: number) => (
                    <div key={index} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{record.type} Record</span>
                        <Badge variant="outline">{record.type}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Name/Host:</span>
                          <div className="flex items-center mt-1">
                            <pre className="bg-white p-1 border rounded-md flex-1 text-xs overflow-x-auto">
                              {record.name}
                            </pre>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCopy(record.name)} 
                              className="ml-2"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Value/Points to:</span>
                          <div className="flex items-center mt-1">
                            <pre className="bg-white p-1 border rounded-md flex-1 text-xs overflow-x-auto">
                              {record.value}
                            </pre>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCopy(record.value)} 
                              className="ml-2"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-100">
                <div>
                  <p className="text-sm font-medium">Need help with DNS configuration?</p>
                  <p className="text-xs text-gray-500">
                    Check your domain registrar's documentation for instructions on how to add DNS records.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-xs">Help Guide</span>
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => verifyDomainMutation.mutate()} 
                  disabled={verifyDomainMutation.isPending}
                  className="gap-2"
                >
                  {verifyDomainMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Verify Domain
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}