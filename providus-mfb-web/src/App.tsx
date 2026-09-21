import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CardsPage } from './pages/CardsPage';
import { IssueCardPage } from './pages/IssueCardPage';
import { FundingPage } from './pages/FundingPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AuditPage } from './pages/AuditPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="cards/issue" element={<IssueCardPage />} />
            <Route path="funding" element={<FundingPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
