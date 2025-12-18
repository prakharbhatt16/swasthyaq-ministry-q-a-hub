import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Loader2, Edit, MessageSquare, Send, X, Trash2, FileText, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Question, QuestionStatus, Comment, House } from '@shared/types';
import { AttachmentList } from '@/components/AttachmentList';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
const questionSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  body: z.string().min(10, 'Body too short'),
  division: z.string().min(1, 'Division required'),
  status: z.enum(['Draft', 'Submitted', 'Admitted', 'Non-Admitted', 'Answered', 'Closed']),
  answer: z.string().optional(),
  memberName: z.string().min(1, 'Member name required'),
  ticketNumber: z.string().optional(),
  house: z.enum(['Lok Sabha', 'Rajya Sabha']),
  tags: z.array(z.string()).optional(),
});
type QuestionFormData = z.infer<typeof questionSchema>;
const statusColors: Record<QuestionStatus, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Submitted: 'bg-yellow-100 text-yellow-800',
  Admitted: 'bg-blue-100 text-blue-800',
  'Non-Admitted': 'bg-orange-100 text-orange-800',
  Answered: 'bg-green-100 text-green-800',
  Closed: 'bg-purple-100 text-purple-800',
};
export default function QuestionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isNew = !id;
  const isViewMode = id && !location.pathname.endsWith('/edit');
  const [tagInput, setTagInput] = useState('');
  const [insertTarget, setInsertTarget] = useState<'body' | 'answer'>('body');
  const { data: question, isLoading: isLoadingQ } = useQuery<Question>({
    queryKey: ['questions', id],
    queryFn: () => api(`/api/questions/${id}`),
    enabled: !!id
  });
  const { data: divisions } = useQuery<string[]>({
    queryKey: ['divisions'],
    queryFn: () => api('/api/divisions')
  });
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: { title: '', body: '', division: '', status: 'Draft', answer: '', memberName: '', house: 'Lok Sabha', tags: [] }
  });
  useEffect(() => {
    if (question) form.reset({ ...question, answer: question.answer || '', tags: question.tags || [] });
  }, [question, form]);
  const mutation = useMutation({
    mutationFn: (data: Partial<Question>) => api<Question>(isNew ? '/api/questions' : `/api/questions/${id}`, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (data) => {
      toast.success('Saved successfully');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      navigate(`/questions/${data.id}`);
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`)
  });
  const handleInsertAttachment = (label: string, url: string) => {
    const link = `\n[${label}](${url})`;
    const current = form.getValues(insertTarget) || '';
    form.setValue(insertTarget, current + link);
    toast.info(`Link inserted into ${insertTarget}`);
  };
  if (isViewMode && question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/questions')}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/questions/${id}/edit`)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{question.ticketNumber}</Badge>
                <Badge className={cn(statusColors[question.status])}>{question.status}</Badge>
                <Badge variant="secondary">{question.house}</Badge>
              </div>
              <CardTitle className="text-3xl font-bold">{question.title}</CardTitle>
              <CardDescription>Division: {question.division} • Asked by {question.memberName}</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none border-t pt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.body}</ReactMarkdown>
            </CardContent>
          </Card>
          {question.answer && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="text-xl">Official Answer</CardTitle></CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.answer}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
          <AttachmentList questionId={question.id} division={question.division} />
        </motion.div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <ThemeToggle className="fixed top-4 right-4" />
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" /> Cancel</Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>{isNew ? 'New Question' : 'Edit Question'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="memberName" render={({ field }) => (
                  <FormItem><FormLabel>Member Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="house" render={({ field }) => (
                  <FormItem><FormLabel>House</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Lok Sabha">Lok Sabha</SelectItem><SelectItem value="Rajya Sabha">Rajya Sabha</SelectItem></SelectContent></Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="division" render={({ field }) => (
                  <FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{divisions?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{['Draft', 'Submitted', 'Admitted', 'Non-Admitted', 'Answered', 'Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="body" render={({ field }) => (
                <FormItem><FormLabel>Question Body (Markdown)</FormLabel><FormControl><Textarea rows={10} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="answer" render={({ field }) => (
                <FormItem><FormLabel>Answer (Markdown)</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
          {!isNew && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border">
                <span className="text-sm font-medium">Insert links into:</span>
                <Select value={insertTarget} onValueChange={v => setInsertTarget(v as any)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="body">Body</SelectItem><SelectItem value="answer">Answer</SelectItem></SelectContent>
                </Select>
              </div>
              <AttachmentList questionId={id!} division={form.watch('division')} onAttachmentAdded={handleInsertAttachment} />
            </div>
          )}
          <div className="flex justify-end"><Button type="submit" size="lg" className="bg-[#F38020] hover:bg-[#d86d11] text-white" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Question</Button></div>
        </form>
      </Form>
    </div>
  );
}