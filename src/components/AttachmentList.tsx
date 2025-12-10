import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, PlusCircle, Trash2, Folder, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Attachment } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
interface AttachmentListProps {
  questionId: string;
  division: string;
}
export function AttachmentList({ questionId, division }: AttachmentListProps) {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [newPath, setNewPath] = useState('');
  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', questionId],
    queryFn: () => api(`/api/attachments?questionId=${questionId}`),
    enabled: !!questionId,
  });
  const addAttachmentMutation = useMutation({
    mutationFn: (newAttachment: Omit<Attachment, 'id' | 'createdAt'>) =>
      api<Attachment>('/api/attachments', {
        method: 'POST',
        body: JSON.stringify(newAttachment),
      }),
    onSuccess: () => {
      toast.success('Attachment added');
      queryClient.invalidateQueries({ queryKey: ['attachments', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions', questionId] });
      setNewLabel('');
      setNewPath('');
    },
    onError: (error) => {
      toast.error(`Failed to add attachment: ${error.message}`);
    },
  });
  const handleAddAttachment = () => {
    if (!newLabel.trim() || !newPath.trim()) {
      toast.warning('Please provide both a label and a folder path.');
      return;
    }
    // Basic URL validation
    try {
      new URL(newPath);
    } catch (_) {
      toast.error('Invalid folder path. Please enter a valid URL.');
      return;
    }
    addAttachmentMutation.mutate({
      questionId,
      label: newLabel,
      folderPath: newPath,
      division,
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : attachments && attachments.length > 0 ? (
          <ul className="space-y-2">
            {attachments.map((att) => (
              <li key={att.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <a
                  href={att.folderPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm font-medium text-primary hover:underline"
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span>{att.label}</span>
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                </a>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No attachments yet.</p>
        )}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Add New Attachment</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Attachment Label (e.g., Report.pdf)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={addAttachmentMutation.isPending}
            />
            <Input
              placeholder="Folder Path (URL)"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              disabled={addAttachmentMutation.isPending}
            />
            <Button
              onClick={handleAddAttachment}
              disabled={addAttachmentMutation.isPending}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}