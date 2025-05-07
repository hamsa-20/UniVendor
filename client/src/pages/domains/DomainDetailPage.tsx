import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Lock, 
  RefreshCw, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainVerification } from '@/components/domains/DomainVerification';

const DomainDetailPage = () => {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  const domainId = parseInt(id);
  
  // Fetch domain details
  const { data: domain, isLoading } = useQuery({
    queryKey: ['/api/domains', domainId],
    enabled: !isNaN(domainId),
  });

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="ml-2">Active</Badge>;
      case 'pending':
        return <Badge variant="warning" className="ml-2">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive" className="ml-2">Error</Badge>;
      default:
        return <Badge variant="secondary" className="ml-2">{status}</Badge>;
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
    }
  };

  const getSslStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <Lock className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Domain Details" subtitle="Loading domain information...">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setLocation('/domains')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Domains
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!domain) {
    return (
      <DashboardLayout title="Domain Details" subtitle="Domain not found">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setLocation('/domains')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Domains
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Domain Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The domain you are looking for does not exist or has been deleted.
            </p>
            <Button onClick={() => setLocation('/domains')}>
              Go Back to Domains
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isDomainActive = domain.status === 'active';
  const isCustomDomain = domain.type === 'custom';
  
  return (
    <DashboardLayout 
      title="Domain Details" 
      subtitle="View and manage details for this domain"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => setLocation('/domains')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Domains
          </Button>
          
          <h2 className="text-2xl font-bold flex items-center">
            {domain.name}
            {getStatusBadge(domain.status)}
            {domain.isPrimary && <Badge variant="secondary" className="ml-2">Primary</Badge>}
          </h2>
        </div>
        
        <div>
          {isDomainActive && (
            <Button
              variant="outline" 
              className="mr-2"
              onClick={() => window.open(`https://${domain.name}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Domain
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isCustomDomain && <TabsTrigger value="verification">Verification & DNS</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Domain Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Domain Name:</span>
                    <span className="col-span-2">{domain.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span className="col-span-2 capitalize">{domain.type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Created:</span>
                    <span className="col-span-2">{domain.createdAt ? formatDate(domain.createdAt) : 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Expires:</span>
                    <span className="col-span-2">{domain.expiresAt ? formatDate(domain.expiresAt) : 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Primary:</span>
                    <span className="col-span-2">{domain.isPrimary ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground">Vendor:</span>
                    <span className="col-span-2">{domain.vendor?.companyName || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Domain Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {domain.status === 'active' 
                          ? 'Domain is active and operational'
                          : domain.status === 'pending'
                          ? 'Domain is pending activation'
                          : 'Domain has errors and is not working'
                        }
                      </p>
                    </div>
                    {getStatusBadge(domain.status)}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Verification Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {domain.verificationStatus === 'verified'
                          ? 'Domain ownership is verified'
                          : domain.verificationStatus === 'failed'
                          ? 'Domain verification failed'
                          : 'Domain ownership verification is pending'
                        }
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getVerificationStatusIcon(domain.verificationStatus)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">SSL Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {domain.sslStatus === 'valid'
                          ? 'SSL certificate is valid and secure'
                          : domain.sslStatus === 'invalid'
                          ? 'SSL certificate is invalid or expired'
                          : 'SSL certificate is pending issuance'
                        }
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getSslStatusIcon(domain.sslStatus)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isCustomDomain && (
            <DomainVerification domain={domain} />
          )}
        </TabsContent>
        
        {isCustomDomain && (
          <TabsContent value="verification">
            <DomainVerification domain={domain} />
          </TabsContent>
        )}
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure settings for this domain</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Domain settings will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DomainDetailPage;