// Mock API for deployment environments without backend
// This will be used during client-side navigation in production

export const setupMockAPI = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Only setup mocks in production or if specifically enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_MOCK_API) return;

  console.log('Setting up mock API handlers for deployment environment');
  
  // Create a mock handler for fetch requests
  const originalFetch = window.fetch;
  
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    
    // If not an API call, proceed normally
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }
    
    console.log(`[Mock API] Request to: ${url}`);
    
    // Mock different API endpoints
    if (url.includes('/api/products')) {
      const productId = url.match(/\/api\/products\/(\d+)/)?.[1];
      
      // Handle specific product request
      if (productId) {
        return new Response(JSON.stringify({
          id: parseInt(productId),
          name: `Product ${productId}`,
          description: "This is a mock product for the demo deployment",
          price: "29.99",
          colors: [
            { id: 1, name: "Red", hex: "#ff0000", imageUrl: "https://placehold.co/400x400/ff0000/ffffff?text=Red" },
            { id: 2, name: "Blue", hex: "#0000ff", imageUrl: "https://placehold.co/400x400/0000ff/ffffff?text=Blue" },
            { id: 3, name: "Green", hex: "#00ff00", imageUrl: "https://placehold.co/400x400/00ff00/ffffff?text=Green" }
          ],
          defaultImage: "https://placehold.co/400x400/dddddd/333333?text=Product",
          vendorId: 1
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      // Handle products list
      return new Response(JSON.stringify([
        { id: 1, name: "T-Shirt", price: "19.99", image: "https://placehold.co/400x400/dddddd/333333?text=T-Shirt" },
        { id: 2, name: "Hoodie", price: "39.99", image: "https://placehold.co/400x400/dddddd/333333?text=Hoodie" },
        { id: 3, name: "Hat", price: "14.99", image: "https://placehold.co/400x400/dddddd/333333?text=Hat" }
      ]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Handle user authentication endpoints
    if (url.includes('/api/auth')) {
      if (url.includes('/logout')) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      if (url.includes('/login') || url.includes('/register')) {
        return new Response(JSON.stringify({
          user: {
            id: 1,
            email: "demo@example.com",
            firstName: "Demo",
            lastName: "User",
            role: "vendor"
          },
          token: "mock-jwt-token"
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      // Current user
      return new Response(JSON.stringify({
        id: 1,
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "vendor"
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Handle cart endpoints with localStorage persistence
    if (url.includes('/api/cart')) {
      // Use localStorage to simulate server persistence
      if (!localStorage.getItem('server_cart')) {
        localStorage.setItem('server_cart', JSON.stringify({
          items: [],
          subtotal: "0.00",
          tax: "0.00",
          total: "0.00"
        }));
      }
      
      const serverCart = JSON.parse(localStorage.getItem('server_cart') || '{}');
      
      // Handle different HTTP methods
      const method = init?.method || 'GET';
      
      if (method === 'GET') {
        return new Response(JSON.stringify(serverCart), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      if (method === 'POST') {
        try {
          const body = JSON.parse(init?.body?.toString() || '{}');
          
          // Add item to cart
          if (!serverCart.items) serverCart.items = [];
          
          const existingItemIndex = serverCart.items.findIndex(
            (item: any) => item.productId === body.productId && item.variant === body.variant
          );
          
          if (existingItemIndex >= 0) {
            serverCart.items[existingItemIndex].quantity += body.quantity;
          } else {
            serverCart.items.push({
              ...body,
              id: Date.now().toString() // Generate unique ID
            });
          }
          
          // Calculate cart totals
          const subtotal = serverCart.items.reduce((total: number, item: any) => 
            total + (parseFloat(item.price) * item.quantity), 0);
          const tax = subtotal * 0.08;
          
          serverCart.subtotal = subtotal.toFixed(2);
          serverCart.tax = tax.toFixed(2);
          serverCart.total = (subtotal + tax).toFixed(2);
          
          localStorage.setItem('server_cart', JSON.stringify(serverCart));
          
          return new Response(JSON.stringify({ success: true, cart: serverCart }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Invalid request' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
        }
      }
      
      if (method === 'PUT') {
        try {
          const body = JSON.parse(init?.body?.toString() || '{}');
          const itemId = url.split('/').pop();
          
          // Update item quantity
          const itemIndex = serverCart.items.findIndex((item: any) => item.id === itemId);
          if (itemIndex >= 0) {
            serverCart.items[itemIndex].quantity = body.quantity;
          }
          
          // Calculate cart totals
          const subtotal = serverCart.items.reduce((total: number, item: any) => 
            total + (parseFloat(item.price) * item.quantity), 0);
          const tax = subtotal * 0.08;
          
          serverCart.subtotal = subtotal.toFixed(2);
          serverCart.tax = tax.toFixed(2);
          serverCart.total = (subtotal + tax).toFixed(2);
          
          localStorage.setItem('server_cart', JSON.stringify(serverCart));
          
          return new Response(JSON.stringify({ success: true, cart: serverCart }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Invalid request' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
        }
      }
      
      if (method === 'DELETE') {
        const segments = url.split('/');
        const lastSegment = segments[segments.length - 1];
        
        // Clear entire cart
        if (lastSegment === 'cart') {
          localStorage.setItem('server_cart', JSON.stringify({
            items: [],
            subtotal: "0.00",
            tax: "0.00",
            total: "0.00"
          }));
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        }
        
        // Remove specific item
        const itemId = lastSegment;
        serverCart.items = serverCart.items.filter((item: any) => item.id !== itemId);
        
        // Calculate cart totals
        const subtotal = serverCart.items.reduce((total: number, item: any) =>
          total + (parseFloat(item.price) * item.quantity), 0);
        const tax = subtotal * 0.08;
        
        serverCart.subtotal = subtotal.toFixed(2);
        serverCart.tax = tax.toFixed(2);
        serverCart.total = (subtotal + tax).toFixed(2);
        
        localStorage.setItem('server_cart', JSON.stringify(serverCart));
        
        return new Response(JSON.stringify({ success: true, cart: serverCart }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }
    
    // Default response for unhandled API endpoints
    return new Response(JSON.stringify({ error: 'Not implemented in demo mode' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 501
    });
  };
};
