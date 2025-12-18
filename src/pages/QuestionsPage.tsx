import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { PlusCircle, Search, LayoutGrid, List, FileQuestion, Download, ChevronDown, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { QuestionStatus } from '@shared/types';
import { QuestionCard } from '@/components/QuestionCard';
import { DIVISIONS } from '@shared/mock-data';
import { useQuestionsQuery } from '@/hooks/useQuestionsQuery';
const PAGE_SIZE = 9;
export default function QuestionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [divisionFilter, setDivisionFilter] = useState(searchParams.get('division') || 'All');
  const [houseFilter, setHouseFilter] = useState(searchParams.get('house') || 'All');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || 'All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 400, [searchTerm]);
  const { data, isLoading, error } = useQuestionsQuery({
    statusFilter, divisionFilter, houseFilter, tagFilter,
    searchTerm: debouncedSearchTerm,
    cursor: cursors[currentPage],
    limit: PAGE_SIZE
  });
  const { data: tagsData } = useQuery<{ tags: string[] }>({
    queryKey: ['tags'],
    queryFn: () => api('/api/tags')
  });
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (divisionFilter !== 'All') params.set('division', divisionFilter);
    if (houseFilter !== 'All') params.set('house', houseFilter);
    if (tagFilter !== 'All') params.set('tag', tagFilter);
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    setSearchParams(params);
    setCurrentPage(0);
    setCursors([null]);
  }, [statusFilter, divisionFilter, houseFilter, tagFilter, debouncedSearchTerm, setSearchParams]);
  useEffect(() => {
    if (data?.next && cursors.length === currentPage + 1) {
      setCursors(prev => [...prev, data.next]);
    }
  }, [data?.next, currentPage, cursors]);
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[], status: QuestionStatus }) =>
      api('/api/questions/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
    onSuccess: () => {
      toast.success('Batch update successful');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setSelectedIds(new Set());
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`)
  });
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'excel') => {
      if (format === 'csv') {
        const csv = await api<string>('/api/questions/export-csv');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `swasthyaq-export-${Date.now()}.csv`;
        a.click();
      } else {
        const res = await fetch('/api/questions/export-excel', { method: 'POST' });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `swasthyaq-export-${Date.now()}.xlsx`;
        a.click();
      }
    },
    onSuccess: () => toast.success('Export completed'),
    onError: (err) => toast.error(`Export failed: ${err.message}`)
  });
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <ThemeToggle className="fixed top-4 right-4 z-50" />
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-4"><ArrowLeft className="h-4 w-4 mr-2" /> Home</Button>
            <h1 className="text-4xl font-bold">Questions</h1>
          </div>
          <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white"><Link to="/questions/new"><PlusCircle className="h-4 w-4 mr-2" /> New Question</Link></Button>
        </header>
        <div className="mb-6 p-4 bg-card rounded-xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {['Draft', 'Submitted', 'Admitted', 'Non-Admitted', 'Answered', 'Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 justify-end">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent><SelectItem value="All">All Divisions</SelectItem>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={houseFilter} onValueChange={setHouseFilter}>
              <SelectTrigger><SelectValue placeholder="House" /></SelectTrigger>
              <SelectContent><SelectItem value="All">All Houses</SelectItem><SelectItem value="Lok Sabha">Lok Sabha</SelectItem><SelectItem value="Rajya Sabha">Rajya Sabha</SelectItem></SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent><SelectItem value="All">All Tags</SelectItem>{tagsData?.tags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Status <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['Draft', 'Submitted', 'Admitted', 'Non-Admitted', 'Answered', 'Closed'].map(s => (
                        <DropdownMenuItem key={s} onSelect={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: s as any })}>{s}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => exportMutation.mutate('csv')}><Download className="h-4 w-4 mr-2" /> Export</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <main>
          {isLoading ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">Error loading questions.</div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No questions found</h3>
              <Button asChild className="mt-4" variant="outline"><Link to="/questions/new">Create One</Link></Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "space-y-4"}>
              {data?.items.map(q => <QuestionCard key={q.id} question={q} isSelected={selectedIds.has(q.id)} onToggleSelect={toggleSelect} viewMode={viewMode} />)}
            </div>
          )}
        </main>
        <footer className="mt-12 flex justify-center items-center gap-4">
          <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>Prev</Button>
          <span className="text-sm font-medium">Page {currentPage + 1}</span>
          <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={!data?.next}>Next</Button>
        </footer>
      </div>
    </div>
  );
}