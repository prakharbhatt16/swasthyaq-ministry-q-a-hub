import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'react-use';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlusCircle, Search, LayoutGrid, List, FileQuestion, Download, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Question, QuestionStatus } from '@shared/types';
import { QuestionCard } from '@/components/QuestionCard';
import { DIVISIONS } from '@shared/mock-data';
const PAGE_SIZE = 9;
export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);
  const { data, isLoading, error } = useQuery<{ items: Question[]; next: string | null }>({
    queryKey: ['questions', statusFilter, divisionFilter, debouncedSearchTerm, currentPage],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (divisionFilter !== 'All') params.append('division', divisionFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (cursors[currentPage]) params.append('cursor', cursors[currentPage]!);
      return api(`/api/questions?${params.toString()}`);
    },
  });
  useEffect(() => {
    if (data?.next && cursors.length === currentPage + 1) {
      setCursors(prev => [...prev, data.next]);
    }
  }, [data, currentPage, cursors.length]);
  const allOnPageSelected = useMemo(() => {
    const items = data?.items ?? [];
    if (items.length === 0) return false;
    return items.every(q => selectedIds.has(q.id));
  }, [data?.items, selectedIds]);
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      const items = data?.items ?? [];
      if (allOnPageSelected) {
        items.forEach(q => newSelected.delete(q.id));
      } else {
        items.forEach(q => newSelected.add(q.id));
      }
      return newSelected;
    });
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[], status: QuestionStatus }) =>
      api('/api/questions/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
    onSuccess: () => {
      toast.success('Questions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      setSelectedIds(new Set());
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`)
  });
  const exportMutation = useMutation({
    mutationFn: () => api<string>('/api/questions/export-csv'),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `swasthyaq-export-${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV export started');
    },
    onError: (err) => toast.error(`Export failed: ${err.message}`)
  });
  const renderContent = () => {
    if (isLoading) {
      const skeletonCount = viewMode === 'grid' ? 6 : 4;
      return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {Array.from({ length: skeletonCount }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      );
    }
    if (error) return <p className="text-center text-destructive">Failed to load questions: {error.message}</p>;
    const items = data?.items ?? [];
    if (items.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No questions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">There are no questions matching your criteria.</p>
          <div className="mt-6">
            <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white"><Link to="/questions/new"><PlusCircle className="mr-2 h-4 w-4" /> Create New Question</Link></Button>
          </div>
        </div>
      );
    }
    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {items.map(question => (
          <QuestionCard key={question.id} question={question} isSelected={selectedIds.has(question.id)} onToggleSelect={toggleSelect} viewMode={viewMode} />
        ))}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Questions</h1>
              <p className="text-muted-foreground mt-1">Browse, search, and manage all questions.</p>
            </div>
            <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white"><Link to="/questions/new"><PlusCircle className="h-4 w-4 mr-2" /> Create Question</Link></Button>
          </header>
          <div className="mb-6 p-4 bg-card rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search questions by title or body..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="All">All Statuses</SelectItem><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Submitted">Submitted</SelectItem><SelectItem value="Answered">Answered</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select>
                <Select value={divisionFilter} onValueChange={setDivisionFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by division" /></SelectTrigger><SelectContent><SelectItem value="All">All Divisions</SelectItem>{DIVISIONS.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              </div>
            </div>
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-primary/5 dark:bg-primary/10 p-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} id="selectAll" />
                    <label htmlFor="selectAll" className="text-sm font-medium">{selectedIds.size} selected</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Actions <ChevronDown className="h-4 w-4 ml-2" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(['Draft', 'Submitted', 'Answered', 'Closed'] as QuestionStatus[]).map(status => (
                          <DropdownMenuItem key={status} onSelect={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status })}>Set status to {status}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                      {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                      Export
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <main>
            {renderContent()}
          </main>
          <footer className="mt-8 flex justify-center items-center gap-4">
            <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0 || isLoading}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
            <Button onClick={() => setCurrentPage(p => p + 1)} disabled={!data?.next || isLoading}>Next</Button>
          </footer>
        </div>
      </div>
    </div>
  );
}