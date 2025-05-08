import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Test Store Page - only used in development to test vendor stores
export default function TestStorePage() {
  const [domainName, setDomainName] = useState('');
  
  // Fetch available domains for testing
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['/api/domains'],
  });
  
  const navigateToStore = (domain: string) => {
    // Add the test_domain parameter to the URL
    window.location.href = `/?test_domain=${domain}`;
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Vendor Store Tester</h1>
        <p className="text-gray-600 mt-2">
          This page is for development purposes only. It allows you to test vendor stores
          without needing to set up actual domains.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enter Custom Domain</CardTitle>
            <CardDescription>
              Enter a domain name to test (must be in the database)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input 
                placeholder="domain.example.com" 
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <Button 
                onClick={() => navigateToStore(domainName)}
                disabled={!domainName}
              >
                Test Store
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Test Domains</CardTitle>
            <CardDescription>
              These domains are available in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : domains.length > 0 ? (
              <ul className="space-y-2">
                {domains.map((domain: any) => (
                  <li key={domain.id} className="flex justify-between items-center">
                    <span className="font-medium">{domain.name}</span>
                    <Button variant="outline" size="sm" onClick={() => navigateToStore(domain.name)}>
                      Test
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-gray-500">No domains available</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/domains" className="text-primary text-sm hover:underline">
              Manage Domains
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800">How to use</h3>
        <p className="text-amber-700 mt-1">
          When you click "Test Store" for a domain, you'll be redirected to the main page with a special
          <code className="bg-amber-100 px-1 rounded">test_domain</code> query parameter. This simulates accessing
          the vendor's store through their domain.
        </p>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}