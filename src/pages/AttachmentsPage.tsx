import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Folder, Link as LinkIcon, Paperclip } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Attachment } from '@shared/types';
import { DIVISIONS } from '@shared/mock-data';
export default function AttachmentsPage() {
  const [divisionFilter, setDivisionFilter] = useState('All');
  const { data: attachments, isLoading, error } = useQuery<Attachment[]>({
    queryKey: ['attachments'],
    queryFn: () => api('/api/attachments'),
  });
  const groupedAndFilteredAttachments = useMemo(() => {
    if (!attachments) return {};
    const filtered = divisionFilter === 'All' ? attachments : attachments.filter(a => a.division === divisionFilter);
    return filtered.reduce((acc, attachment) => {
      (acc[attachment.division] = acc[attachment.division] || []).push(attachment);
      return acc;
    }, {} as Record<string, Attachment[]>);
  }, [attachments, divisionFilter]);
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Attachments</h1>
              <p className="text-muted-foreground mt-1">Browse all attachments grouped by division.</p>
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filter by division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {DIVISIONS.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
              </SelectContent>
            </Select>
          </header>
          <main>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <p className="text-center text-destructive">Failed to load attachments: {error.message}</p>
            ) : Object.keys(groupedAndFilteredAttachments).length > 0 ? (
              <Accordion type="multiple" className="w-full space-y-4">
                {Object.entries(groupedAndFilteredAttachments).map(([division, atts]) => (
                  <AccordionItem value={division} key={division} className="bg-card border rounded-lg">
                    <AccordionTrigger className="px-6 text-lg font-medium">
                      {division} ({atts.length})
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-2">
                        {atts.map(att => (
                          <Card key={att.id}>
                            <CardContent className="p-3 flex justify-between items-center">
                              <a href={att.folderPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-primary hover:underline">
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <span>{att.label}</span>
                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                              </a>
                              <Link to={`/questions/${att.questionId}`} className="text-xs text-muted-foreground hover:underline">
                                View Question
                              </Link>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No attachments found</h3>
                <p className="mt-1 text-sm text-muted-foreground">There are no attachments matching your criteria.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}