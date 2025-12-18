import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, PlusCircle, Folder, Link as LinkIcon, Trash2, Loader2, Upload, FileIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { api } from '@/lib/api-client';
import type { Attachment } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
interface AttachmentListProps {
  questionId: string;
  division: string;
  onAttachmentAdded?: (label: string, path: string) => void;
}
export function AttachmentList({ questionId, division, onAttachmentAdded }: AttachmentListProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', questionId],
    queryFn: () => api(`/api/attachments?questionId=${questionId}`),
    enabled: !!questionId,
  });
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('questionId', questionId);
    formData.append('division', division);
    formData.append('label', file.name);
    try {
      setUploadProgress(30);
      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });
      setUploadProgress(80);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }
      const newAtt = json.data as Attachment;
      toast.success(`File "${file.name}" uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['attachments', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions', questionId] });
      if (onAttachmentAdded && newAtt.downloadUrl) {
        onAttachmentAdded(newAtt.label, newAtt.downloadUrl);
      }
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: string) => api(`/api/attachments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Attachment deleted');
      queryClient.invalidateQueries({ queryKey: ['attachments', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions', questionId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete attachment: ${error.message}`);
    },
  });
  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <motion.li key={att.id} whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-2 rounded-md hover:bg-accent group border border-transparent hover:border-border">
                <div className="flex items-center gap-3 overflow-hidden">
                  {att.r2Key ? <FileIcon className="h-4 w-4 text-blue-500 shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="flex flex-col min-w-0">
                    <a
                      href={att.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate flex items-center gap-1"
                    >
                      {att.label}
                      <Download className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {att.size && <span>{formatSize(att.size)}</span>}
                      <span>{formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      {deleteAttachmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove "{att.label}"? This will permanently delete the file from storage.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteAttachmentMutation.mutate(att.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No attachments yet.</p>
        )}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Upload New File</h4>
            <span className="text-[10px] text-muted-foreground">Max 10MB</span>
          </div>
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer relative"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, PNG, JPG</p>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-xs mt-2 font-medium">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}