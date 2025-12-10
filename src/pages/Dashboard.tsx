import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutGrid, ListChecks, FileText, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Metrics } from '@shared/types';
const COLORS = ['#667EEA', '#F38020', '#374151', '#4CAF50', '#FFC107'];
export default function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: () => api('/api/metrics'),
  });
  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        Failed to load dashboard data: {error.message}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of Q&A activity.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/questions">View All Questions</Link>
              </Button>
              <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white">
                <Link to="/questions/new"><PlusCircle className="h-4 w-4 mr-2" /> Create Question</Link>
              </Button>
            </div>
          </header>
          <main className="space-y-8">
            {/* Stats Grid */}
            <motion.div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
              ) : (
                <>
                  <StatCard title="Total Questions" value={metrics?.totalQuestions ?? 0} icon={FileText} />
                  <StatCard title="Answered" value={metrics?.byStatus.find(s => s.status === 'Answered')?.count ?? 0} icon={ListChecks} />
                  <StatCard title="Submitted" value={metrics?.byStatus.find(s => s.status === 'Submitted')?.count ?? 0} icon={LayoutGrid} />
                  <StatCard title="Total Attachments" value={metrics?.totalAttachments ?? 0} icon={FileText} />
                </>
              )}
            </motion.div>
            {/* Charts Grid */}
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Questions by Division</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-72" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics?.byDivision}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="division" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#667EEA" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Questions by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-72" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics?.byStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {metrics?.byStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}