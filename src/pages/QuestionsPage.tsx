import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/../ThemeToggle';
import { PlusCircle, Search, LayoutGrid, List, FileQuestion } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Question } from '@shared/types';
import { QuestionCard } from '@/components/QuestionCard';
import { DIVISIONS } from '@shared/mock-data';
export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading, error } = useQuery<{ items: Question[] }>({
    queryKey: ['questions', statusFilter, divisionFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (divisionFilter !== 'All') params.append('division', divisionFilter);
      return api(`/api/questions?${params.toString()}`);
    },
  });
  const filteredQuestions = data?.items.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-destructive">Failed to load questions: {error.message}</p>;
    }
    if (!filteredQuestions || filteredQuestions.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No questions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no questions matching your criteria.
          </p>
          <div className="mt-6">
            <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white">
              <Link to="/questions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Question
              </Link>
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map(question => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Questions</h1>
              <p className="text-muted-foreground mt-1">Browse, search, and manage all questions.</p>
            </div>
            <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white">
              <Link to="/questions/new"><PlusCircle className="h-4 w-4 mr-2" /> Create Question</Link>
            </Button>
          </header>
          <div className="mb-6 p-4 bg-card rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions by title..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Answered">Answered</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Divisions</SelectItem>
                  {DIVISIONS.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <main>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}