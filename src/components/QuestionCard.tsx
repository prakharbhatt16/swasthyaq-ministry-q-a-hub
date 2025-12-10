import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Paperclip, Calendar, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Question, QuestionStatus } from '@shared/types';
import { cn } from '@/lib/utils';
interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  viewMode?: 'grid' | 'list';
}
const statusColors: { [key in QuestionStatus]: string } = {
  Draft: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
  Submitted: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80',
  Answered: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80',
  Closed: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/80',
};
export function QuestionCard({ question, isSelected, onToggleSelect, viewMode = 'grid' }: QuestionCardProps) {
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("transition-all duration-300 flex items-center", isSelected && "ring-2 ring-primary")}>
          <div className="p-4 flex items-center">
            <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(question.id)} aria-label={`Select question ${question.title}`} />
          </div>
          <div className="flex-grow p-4">
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                <Link to={`/questions/${question.id}`} className="font-bold text-blue-600 hover:underline">{question.ticketNumber}</Link>
                <Link to={`/questions/${question.id}`} className="font-semibold hover:underline line-clamp-1 ml-2" aria-label={`View ${question.title} details`}>{question.title}</Link>
                <p className="text-xs text-muted-foreground">by {question.memberName}</p>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">{question.division}</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={cn('transition-colors', statusColors[question.status])}>{question.status}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>Updated {formatDistanceToNow(new Date(question.updatedAt), { addSuffix: true })}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="p-4 hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to={`/questions/${question.id}/edit`} aria-label={`Edit ${question.title}`}><Edit className="h-4 w-4" /></Link></Button>
          </div>
        </Card>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      className="relative"
    >
      <div className="absolute top-4 right-4 z-10">
        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(question.id)} aria-label={`Select question ${question.title}`} />
      </div>
      <Card className={cn("h-full flex flex-col overflow-hidden transition-shadow duration-300", isSelected && "ring-2 ring-primary")}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2 mb-2">
            <Badge variant="secondary">{question.division}</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={cn('transition-colors mr-10', statusColors[question.status])}>{question.status}</Badge>
                </TooltipTrigger>
                <TooltipContent>Updated {formatDistanceToNow(new Date(question.updatedAt), { addSuffix: true })}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Link to={`/questions/${question.id}`} className="font-bold text-blue-600 hover:underline block mb-1">{question.ticketNumber}</Link>
          <CardTitle className="text-lg leading-tight">
            <Link to={`/questions/${question.id}`} className="hover:text-primary/80 transition-colors" aria-label={`View ${question.title} details`}>{question.title}</Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">by {question.memberName}</p>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{question.body}</p>
          {question.answer && (
            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
              <strong>Answer:</strong> {question.answer}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                </TooltipTrigger>
                <TooltipContent><p>Created at: {new Date(question.createdAt).toLocaleString()}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1"><Paperclip className="h-3 w-3" /><span>{question.attachmentIds.length}</span></div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none"><Link to={`/questions/${question.id}/edit`} aria-label={`Edit ${question.title}`}><Edit className="h-4 w-4 mr-2" /> Edit</Link></Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}