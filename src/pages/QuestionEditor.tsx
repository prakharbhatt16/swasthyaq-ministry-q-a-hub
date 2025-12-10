import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Question, QuestionStatus } from '@shared/types';
import { AttachmentList } from '@/components/AttachmentList';
const questionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long'),
  body: z.string().min(20, 'Body must be at least 20 characters long'),
  division: z.string().min(1, 'Please select a division'),
  status: z.enum(['Draft', 'Submitted', 'Answered', 'Closed']),
});
type QuestionFormData = z.infer<typeof questionSchema>;
export default function QuestionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { data: question, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: ['questions', id],
    queryFn: () => api(`/api/questions/${id}`),
    enabled: !isNew,
  });
  const { data: divisions, isLoading: isLoadingDivisions } = useQuery<string[]>({
    queryKey: ['divisions'],
    queryFn: () => api('/api/divisions'),
  });
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      body: '',
      division: '',
      status: 'Draft',
    },
  });
  useEffect(() => {
    if (question) {
      form.reset({
        title: question.title,
        body: question.body,
        division: question.division,
        status: question.status,
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
      navigate(isNew ? `/questions/${data.id}` : `/questions/${id}`);
    },
    onError: (error) => {
      toast.error(`Failed to save question: ${error.message}`);
    },
  });
  const onSubmit = (data: QuestionFormData) => {
    mutation.mutate(data);
  };
  const isLoading = isLoadingQuestion || isLoadingDivisions;
  return (
    <div className="min-h-screen bg-secondary/40">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button variant="ghost" onClick={() => navigate('/questions')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{isNew ? 'Create New Question' : 'Edit Question'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-1/2" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter question title..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="division"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Division</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a division" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {divisions?.map((div) => (
                                    <SelectItem key={div} value={div}>{div}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(['Draft', 'Submitted', 'Answered', 'Closed'] as QuestionStatus[]).map((status) => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Body</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed question text..." rows={8} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              {!isNew && question && (
                <AttachmentList questionId={question.id} division={question.division} />
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending} className="bg-[#F38020] hover:bg-[#d86d11] text-white">
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isNew ? 'Create Question' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}