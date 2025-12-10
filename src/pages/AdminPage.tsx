import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api-client';
import type { AuditLog } from '@shared/types';
import { Shield, LogIn, Database, Download, AlertTriangle, Loader2 } from 'lucide-react';
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('password');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!loggedIn) {
      passwordInputRef.current?.focus();
    }
  }, [loggedIn]);
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: () => api('/api/audit-logs'),
    enabled: loggedIn,
  });
  const seedMutation = useMutation({
    mutationFn: () => api('/api/admin/seed', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Data re-seeded successfully!');
      queryClient.invalidateQueries(); // Invalidate all queries
    },
    onError: (err) => toast.error(`Seeding failed: ${err.message}`),
  });
  const exportMutation = useMutation({
    mutationFn: () => api<string>('/api/questions/export-csv'),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `swasthyaq-export-all-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Full CSV export started');
    },
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });
  const handleLogin = () => {
    if (password === 'password') {
      setLoggedIn(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Incorrect password');
    }
  };
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/40">
        <ThemeToggle className="fixed top-4 right-4" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2"><Shield /> Admin Access</CardTitle>
              <CardDescription>Enter the password to manage the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input ref={passwordInputRef} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              <Button onClick={handleLogin} className="w-full bg-[#F38020] hover:bg-[#d86d11] text-white"><LogIn className="mr-2 h-4 w-4" /> Log In</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Controls</h1>
            <p className="text-muted-foreground mt-1">Manage application data and settings.</p>
          </header>
          <main className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database /> Data Management</CardTitle>
                  <CardDescription>Actions related to application data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>These actions are destructive and may result in data loss. Proceed with caution.</AlertDescription>
                  </Alert>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={seedMutation.isPending}>
                        {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Re-seed Demo Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will reset all questions and attachments to the initial demo state. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => seedMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm & Re-seed</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Download /> Data Export</CardTitle>
                  <CardDescription>Export all application data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Download a CSV file containing all questions in the database.</p>
                  <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                    {exportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download All as CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Recent administrative actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingLogs ? (
                        <TableRow><TableCell colSpan={4} className="text-center">Loading logs...</TableCell></TableRow>
                      ) : (
                        auditLogs?.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.action}</TableCell>
                            <TableCell>{log.entity} ({log.entityId})</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{format(new Date(log.timestamp), "PPpp")}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}