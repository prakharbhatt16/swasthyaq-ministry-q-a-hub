import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, Paperclip, Calendar, Edit, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Question } from '@shared/types';
import { cn } from '@/lib/utils';
interface QuestionCardProps {
  question: Question;
}
const statusColors: { [key in Question['status']]: string } = {
  Draft: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  Submitted: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  Answered: 'bg-green-100 text-green-800 hover:bg-green-200',
  Closed: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
};
export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    >
      <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <Badge variant="secondary">{question.division}</Badge>
            <Badge className={cn('transition-colors', statusColors[question.status])}>
              {question.status}
            </Badge>
          </div>
          <CardTitle className="pt-2 text-lg leading-tight">
            <Link to={`/questions/${question.id}`} className="hover:text-primary/80 transition-colors">
              {question.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{question.body}</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Created at: {new Date(question.createdAt).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{question.attachmentIds.length}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none">
              <Link to={`/questions/${question.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-none bg-[#F38020] hover:bg-[#d86d11] text-white">
              <Link to={`/questions/${question.id}`}>
                Open <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}