// Global setup for the application
// This file is imported before rendering to ensure global setup is done

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // In a real app, you might want to send this to an error tracking service
});

// Add network status monitoring
window.addEventListener('online', () => {
  console.log('Application is online');
});

window.addEventListener('offline', () => {
  console.log('Application is offline');
});

// Setup environment defaults
if (!import.meta.env.VITE_APP_NAME) {
  console.warn('VITE_APP_NAME environment variable is not set. Using default.');
}

// You could also set up analytics, monitoring, or other global services here

// This is a side-effect only module, it doesn't export anything
export {};
