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
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import Dashboard from '@/pages/Dashboard';
import QuestionsPage from '@/pages/QuestionsPage';
import QuestionEditor from '@/pages/QuestionEditor';
import AttachmentsPage from '@/pages/AttachmentsPage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/ui/theme-provider";
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/questions",
    element: <QuestionsPage />,
  },
  {
    path: "/questions/new",
    element: <QuestionEditor />,
  },
  {
    path: "/questions/:id",
    element: <QuestionEditor />,
  },
  {
    path: "/questions/:id/edit",
    element: <QuestionEditor />,
  },
  {
    path: "/attachments",
    element: <AttachmentsPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ErrorBoundary>
          <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
          <Toaster richColors closeButton />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)