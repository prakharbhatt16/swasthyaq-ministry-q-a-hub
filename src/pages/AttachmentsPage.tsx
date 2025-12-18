import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Folder, Paperclip, ArrowLeft, Download, FileIcon, ImageIcon, FileTextIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Attachment } from '@shared/types';
import { DIVISIONS } from '@shared/mock-data';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
const formatSize = (bytes: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};
export default function AttachmentsPage() {
  const navigate = useNavigate();
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: attachments, isLoading, error } = useQuery<Attachment[]>({
    queryKey: ['attachments'],
    queryFn: () => api('/api/attachments'),
  });
  const handleDownload = async (att: Attachment) => {
    if (!att.downloadUrl) return;
    if (att.folderPath) {
      window.open(att.folderPath, '_blank');
      return;
    }
    setDownloadingId(att.id);
    try {
      const response = await fetch(att.downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.filename || att.label || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      if (response.headers.get('X-Mock-Download') === 'true') {
        toast.info('Downloaded mock file (R2 storage not active)');
      }
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-pink-500 shrink-0" />;
    if (mimeType.includes('pdf')) return <FileTextIcon className="h-4 w-4 text-red-500 shrink-0" />;
    return <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />;
  };
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
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Button>
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
                  <motion.div key={division} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <AccordionItem value={division} className="bg-card border rounded-lg">
                      <AccordionTrigger className="px-6 text-lg font-medium">
                        {division} ({atts.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-2">
                          {atts.map(att => (
                            <Card key={att.id} className="hover:bg-accent transition-colors group">
                              <CardContent className="p-3 flex justify-between items-center">
                                <button 
                                  onClick={() => handleDownload(att)}
                                  className="flex items-center gap-3 text-sm font-medium text-primary hover:underline text-left"
                                  disabled={downloadingId === att.id}
                                >
                                  {att.r2Key ? getFileIcon(att.mimeType) : <Folder className="h-4 w-4 text-muted-foreground shrink-0" />}
                                  <span>{att.label}</span>
                                  <span className="text-xs text-muted-foreground">{att.size ? formatSize(att.size) : ''}</span>
                                  {downloadingId === att.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </button>
                                <Link to={`/questions/${att.questionId}`} className="text-xs text-muted-foreground hover:underline">
                                  View Question
                                </Link>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Paperclip className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No attachments found</h3>
                <p className="mt-1 text-sm text-muted-foreground">There are no attachments matching your criteria.</p>
                <Button asChild className="mt-4"><Link to="/questions/new">Create a Question</Link></Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}