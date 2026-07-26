import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { bootstrapDocumentTheme } from './theme/applyTheme';
import AppErrorBoundary from './components/AppErrorBoundary';
import App from './App';
import './i18n';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

bootstrapDocumentTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*
        React Router 7 wraps history updates in startTransition by default.
        History can commit (URL changes) while a concurrent UI transition is
        aborted — URL becomes /login but the previous page stays mounted.
        useTransitions={false} applies location updates synchronously.
      */}
      <BrowserRouter useTransitions={false}>
        <AppErrorBoundary>
          <AuthProvider>
            <ThemeProvider>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="colored"
              />
            </ThemeProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
