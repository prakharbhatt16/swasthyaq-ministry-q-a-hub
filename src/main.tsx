import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import Dashboard from '@/pages/Dashboard';
import QuestionsPage from '@/pages/QuestionsPage';
import QuestionEditor from '@/pages/QuestionEditor';
import AttachmentsPage from '@/pages/AttachmentsPage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/questions",
    element: <QuestionsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/questions/new",
    element: <QuestionEditor />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/questions/:id",
    element: <QuestionEditor />, // Using editor as detail view for now
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/questions/:id/edit",
    element: <QuestionEditor />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/attachments",
    element: <AttachmentsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)