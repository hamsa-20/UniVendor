import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Domain } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DomainVerificationProps = {
  domainId: number;
};

type DnsRecord = {
  type: string;
  name: string;
  value: string;
};

const DomainVerification = ({ domainId }: DomainVerificationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('txt');

  // Fetch domain details
  const { data: domain, isLoading: isLoadingDomain } = useQuery({
    queryKey: ['/api/domains', domainId],
  });

  // Fetch DNS records for the domain
  const { data: dnsRecords, isLoading: isLoadingDnsRecords } = useQuery({
    queryKey: ['/api/domains', domainId, 'dns-records'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/domains/${domainId}/dns-records`);
      return await res.json();
    },
    enabled: !!domainId && domain?.type === 'custom',
  });

  // Verify domain mutation
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/domains/${domainId}/verify`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Domain verification successful',
        description: 'The domain has been verified and is now active.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/domains', domainId] });
      queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
    },
    onError: (error) => {
      toast({
        title: 'Verification failed',
        description: `Unable to verify domain: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The value has been copied to your clipboard.',
    });
  };

  // If the domain is not a custom domain, show an error
  if (domain && domain.type !== 'custom') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Verification</CardTitle>
          <CardDescription>Verify ownership of your custom domain</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not applicable</AlertTitle>
            <AlertDescription>
              Verification is only required for custom domains. This is a subdomain which is automatically configured.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If loading
  if (isLoadingDomain || isLoadingDnsRecords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Verification</CardTitle>
          <CardDescription>Loading verification details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-6 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter DNS records by type
  const txtRecords = dnsRecords?.filter((record: DnsRecord) => record.type === 'TXT') || [];
  const cnameRecords = dnsRecords?.filter((record: DnsRecord) => record.type === 'CNAME') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Verification</CardTitle>
        <CardDescription>
          Verify ownership of your domain by adding these DNS records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status information */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-2">
            <strong className="text-sm">Domain:</strong>
            <span className="text-sm">{domain?.name}</span>
            <Badge variant={domain?.status === 'active' ? 'success' : 'warning'}>
              {domain?.status === 'active' ? 'Active' : 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <strong className="text-sm">Verification Status:</strong>
            <span className="text-sm">
              {domain?.verificationStatus === 'verified' ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="flex items-center text-amber-500">
                  <AlertCircle className="mr-1 h-4 w-4" /> Pending
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <strong className="text-sm">SSL Status:</strong>
            <span className="text-sm">
              {domain?.sslStatus === 'valid' ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Valid
                </span>
              ) : (
                <span className="flex items-center text-amber-500">
                  <AlertCircle className="mr-1 h-4 w-4" /> {domain?.sslStatus}
                </span>
              )}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Verification status alert */}
        {domain?.verificationStatus === 'verified' ? (
          <Alert className="mb-6" variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Domain Verified</AlertTitle>
            <AlertDescription>
              Your domain has been successfully verified and is now active.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              Please add the following DNS records to your domain to verify ownership. 
              This process may take up to 24 hours to complete after you add the records.
            </AlertDescription>
          </Alert>
        )}

        {/* DNS Records Tabs */}
        <Tabs defaultValue="txt" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="txt">TXT Record (Verification)</TabsTrigger>
            <TabsTrigger value="cname">CNAME Records (Routing)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="txt">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record Type</TableHead>
                    <TableHead>Name / Host</TableHead>
                    <TableHead>Value / Target</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txtRecords.length > 0 ? (
                    txtRecords.map((record: DnsRecord, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.type}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell className="font-mono text-xs">{record.value}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No TXT records available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              The TXT record is used to verify that you own the domain.
            </p>
          </TabsContent>
          
          <TabsContent value="cname">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record Type</TableHead>
                    <TableHead>Name / Host</TableHead>
                    <TableHead>Value / Target</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cnameRecords.length > 0 ? (
                    cnameRecords.map((record: DnsRecord, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.type}</TableCell>
                        <TableCell>{record.name.replace(`www.`, '@')}</TableCell>
                        <TableCell>{record.value}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No CNAME records available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              CNAME records route traffic from your domain to our server.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/domains', domainId, 'dns-records'] });
            queryClient.invalidateQueries({ queryKey: ['/api/domains', domainId] });
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="secondary"
            onClick={() => window.open(`https://www.whatsmydns.net/#TXT/${domain?.name}`, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Check DNS Propagation
          </Button>
          <Button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending || domain?.verificationStatus === 'verified'}
          >
            {verifyMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Verify Domain
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DomainVerification;