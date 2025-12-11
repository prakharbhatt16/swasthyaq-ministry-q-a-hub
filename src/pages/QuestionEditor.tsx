import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Save, Loader2, Edit, MessageSquare, Send } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Question, QuestionStatus, Comment, House } from '@shared/types';
import { AttachmentList } from '@/components/AttachmentList';
import { Badge } from '@/components/ui/badge';
const questionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long'),
  body: z.string().min(20, 'Body must be at least 20 characters long'),
  division: z.string().min(1, 'Please select a division'),
  status: z.enum(['Draft', 'Submitted', 'Answered', 'Closed']),
  answer: z.string().optional(),
  memberName: z.string().min(1, 'Member name is required'),
  ticketNumber: z.string().optional(),
  house: z.enum(['Lok Sabha', 'Rajya Sabha'], { required_error: 'House is required' }),
});
type QuestionFormData = z.infer<typeof questionSchema>;
function CommentsSection({ questionId }: { questionId: string }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', questionId],
    queryFn: () => api(`/api/questions/${questionId}/comments`),
  });
  const mutation = useMutation({
    mutationFn: (text: string) => api<Comment>(`/api/questions/${questionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
    onSuccess: () => {
      toast.success('Comment added');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] });
    },
    onError: (err) => toast.error(`Failed to add comment: ${err.message}`),
  });
  const handleAddComment = () => {
    if (newComment.trim()) {
      mutation.mutate(newComment.trim());
    }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? <Skeleton className="h-20" /> : (
            comments && comments.length > 0 ? (
              <ul className="space-y-3">
                {comments.map(comment => (
                  <li key={comment.id} className="text-sm p-2 bg-secondary rounded-md">
                    <p>{comment.text}</p>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      - {comment.author}, {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
          )}
          <div className="flex gap-2 pt-4 border-t">
            <Input placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} disabled={mutation.isPending} />
            <Button onClick={handleAddComment} disabled={mutation.isPending}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default function QuestionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEditMode = location.pathname.endsWith('/edit') || !location.pathname.endsWith('/new');
  const isNew = !id;
  const isViewMode = id && !location.pathname.endsWith('/edit');
  const { data: question, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: ['questions', id],
    queryFn: () => api(`/api/questions/${id}`),
    enabled: !!id,
  });
  const { data: divisions, isLoading: isLoadingDivisions } = useQuery<string[]>({
    queryKey: ['divisions'],
    queryFn: () => api('/api/divisions'),
  });
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: { title: '', body: '', division: '', status: 'Draft', answer: '', memberName: '', ticketNumber: '', house: 'Lok Sabha' },
  });
  useEffect(() => {
    if (question) {
      form.reset({
        title: question.title,
        body: question.body,
        division: question.division,
        status: question.status,
        answer: question.answer || '',
        memberName: question.memberName,
        ticketNumber: question.ticketNumber,
        house: question.house,
      });
    }
  }, [question, form]);
  const mutation = useMutation({
    mutationFn: (data: Partial<Question>) => {
      const url = isNew ? '/api/questions' : `/api/questions/${id}`;
      const method = isNew ? 'POST' : 'PATCH';
      return api<Question>(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: (data) => {
      toast.success(`Question ${isNew ? 'created' : 'updated'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['attachments', id] });
      }
      navigate(isNew ? `/questions/${data.id}` : `/questions/${id}`);
    },
    onError: (error) => toast.error(`Failed to save question: ${error.message}`),
  });
  const onSubmit = (data: QuestionFormData) => mutation.mutate(data);
  const isLoading = isLoadingQuestion || isLoadingDivisions;
  if (isViewMode) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" onClick={() => navigate('/questions')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Questions</Button>
              <Button onClick={() => navigate(`/questions/${id}/edit`)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
            </div>
            {isLoading ? <Skeleton className="h-96 w-full" /> : question && (
              <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge>{question.ticketNumber}</Badge>
                      <Badge variant="secondary">Asked by: {question.memberName}</Badge>
                      <Badge variant="outline">{question.house}</Badge>
                      <Badge variant="outline">{question.status}</Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">{question.title}</CardTitle>
                    <CardDescription>Division: {question.division}</CardDescription>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap">{question.body}</p></CardContent>
                </Card>
                {question.answer && (
                  <Card>
                    <CardHeader><CardTitle>Answer</CardTitle></CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{question.answer}</p></CardContent>
                  </Card>
                )}
                <AttachmentList questionId={question.id} division={question.division} />
                <CommentsSection questionId={question.id} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button variant="ghost" onClick={() => navigate(id ? `/questions/${id}` : '/questions')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader><CardTitle>{isNew ? 'Create New Question' : 'Edit Question'}</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {isLoading && !isNew ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-1/2" /><Skeleton className="h-32 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="memberName" render={({ field }) => (<FormItem><FormLabel>Member Name</FormLabel><FormControl><Input placeholder="e.g., Dr. Rajesh Kumar" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          {!isNew && <FormField control={form.control} name="ticketNumber" render={({ field }) => (<FormItem><FormLabel>Ticket Number</FormLabel><FormControl><Input readOnly {...field} /></FormControl><FormMessage /></FormItem>)} />}
                        </div>
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter question title..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="division" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl><SelectContent>{divisions?.map((div) => (<SelectItem key={div} value={div}>{div}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="house" render={({ field }) => (<FormItem><FormLabel>House</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a house" /></SelectTrigger></FormControl><SelectContent>{(['Lok Sabha', 'Rajya Sabha'] as House[]).map((house) => (<SelectItem key={house} value={house}>{house}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{(['Draft', 'Submitted', 'Answered', 'Closed'] as QuestionStatus[]).map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="body" render={({ field }) => (<FormItem><FormLabel>Question Body</FormLabel><FormControl><Textarea placeholder="Detailed question text..." rows={8} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="answer" render={({ field }) => (<FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea placeholder="Provide the official answer here..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </>
                    )}
                  </CardContent>
                </Card>
                {!isNew && id && (
                  <AttachmentList questionId={id} division={form.watch('division') || question?.division || ''} />
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending} className="bg-[#F38020] hover:bg-[#d86d11] text-white">
                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isNew ? 'Create Question' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}