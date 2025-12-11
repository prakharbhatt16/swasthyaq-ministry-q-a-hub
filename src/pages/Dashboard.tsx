import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, PlusCircle, Paperclip, Activity, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Metrics, RecentActivity, House, QuestionStatus } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
const COLORS: { [key in QuestionStatus]?: string } = {
  Answered: '#4CAF50',
  Submitted: '#FFC107',
  Draft: '#9E9E9E',
  Closed: '#673AB7',
  Admitted: '#3B82F6',
  'Non-Admitted': '#F59E0B',
};
const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ElementType }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="opacity-100 block">
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  </motion.div>
);
export default function Dashboard() {
  const navigate = useNavigate();
  const [houseFilter, setHouseFilter] = useState('All');
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery<Metrics>({
    queryKey: ['metrics', houseFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (houseFilter !== 'All') params.append('house', houseFilter);
      return api(`/api/metrics?${params.toString()}`);
    },
  });
  const { data: recentActivity, isLoading: isLoadingActivity, error: activityError } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activity'],
    queryFn: () => api('/api/recent-activity'),
  });
  const error = metricsError || activityError;
  const statusCounts = metrics?.byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), { Draft: 0, Submitted: 0, Admitted: 0, 'Non-Admitted': 0, Answered: 0, Closed: 0 }) || { Draft: 0, Submitted: 0, Admitted: 0, 'Non-Admitted': 0, Answered: 0, Closed: 0 };
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        Failed to load dashboard data: {error.message}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Button>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of Q&A activity.</p>
            </div>
            <div className="flex gap-4 items-center">
              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by house" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Houses</SelectItem>
                  <SelectItem value="Lok Sabha">Lok Sabha</SelectItem>
                  <SelectItem value="Rajya Sabha">Rajya Sabha</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white"><Link to="/questions/new"><PlusCircle className="h-4 w-4 mr-2" /> Create Question</Link></Button>
            </div>
          </header>
          <main className="space-y-8">
            <motion.div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {isLoadingMetrics ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
              ) : (
                <>
                  <StatCard title="Total Questions" value={metrics?.totalQuestions ?? 0} icon={FileText} />
                  <StatCard title="Answered" value={statusCounts.Answered} icon={CheckCircle} />
                  <StatCard title="Pending" value={statusCounts.Submitted + statusCounts.Draft + statusCounts.Admitted} icon={Clock} />
                  <StatCard title="Total Attachments" value={metrics?.totalAttachments ?? 0} icon={Paperclip} />
                </>
              )}
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
              <Card className="lg:col-span-3 opacity-100 block">
                <CardHeader><CardTitle>Questions by Division</CardTitle></CardHeader>
                <CardContent>
                  {isLoadingMetrics ? <Skeleton className="h-72" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics?.byDivision}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="division" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#667EEA" radius={[4, 4, 0, 0]}>
                          {metrics?.byDivision.map((entry, index) => (
                            <Cell key={`cell-${index}`} cursor="pointer" onClick={() => navigate(`/questions?division=${entry.division}`)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 opacity-100 block">
                <CardHeader><CardTitle>Questions by Status</CardTitle></CardHeader>
                <CardContent>
                  {isLoadingMetrics ? <Skeleton className="h-72" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={metrics?.byStatus} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="count" nameKey="status" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {metrics?.byStatus.map((entry) => (
                            <Cell key={`cell-${entry.status}`} fill={COLORS[entry.status] || '#000000'} cursor="pointer" onClick={() => navigate(`/questions?status=${entry.status}`)} />
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
            <Card className="opacity-100 block">
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {isLoadingActivity ? <Skeleton className="h-40" /> : (
                  <ul className="space-y-4">
                    {recentActivity?.map((item, i) => (
                      <motion.li key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <Link to={`/questions/${item.id}`} className="font-medium hover:underline">
                          <span className="font-bold text-primary">{item.ticketNumber}</span> - {item.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{item.status}</Badge>
                          <span>{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}