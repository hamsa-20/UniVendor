import React from 'react';
import { Button } from '@/components/ui/button';

export default function SimpleTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Simple Test Page</h1>
      <p className="mb-4">This is a simple test page with no complex dependencies.</p>
      
      <Button onClick={() => alert('Button clicked!')}>
        Click Me
      </Button>
    </div>
  );
}
