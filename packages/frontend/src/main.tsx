import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.tsx';
import './app/styles/global.css';
import './app/styles/landing-animations.css';

// Initialize node registry and extensions BEFORE React app starts
import '@/app/node-extensions'; // Initialize component factory and registry
import '@/core/nodes/definitions'; // Register core node definitions (includes unified Transform node)
import '@/app/data/nodes/communication/gmail'; // Register Gmail node - CRITICAL: Must be before React

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
