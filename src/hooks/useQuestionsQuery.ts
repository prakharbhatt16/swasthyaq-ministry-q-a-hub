import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Question } from '@shared/types';
const PAGE_SIZE = 9;
interface UseQuestionsQueryProps {
  statusFilter?: string;
  divisionFilter?: string;
  houseFilter?: string;
  tagFilter?: string;
  searchTerm?: string;
  cursor?: string | null;
  limit?: number;
  enabled?: boolean;
}
export function useQuestionsQuery({
  statusFilter = 'All',
  divisionFilter = 'All',
  houseFilter = 'All',
  tagFilter = 'All',
  searchTerm = '',
  cursor = null,
  limit = PAGE_SIZE,
  enabled = true,
}: UseQuestionsQueryProps) {
  const queryKey = ['questions', { statusFilter, divisionFilter, houseFilter, tagFilter, searchTerm, cursor, limit }];
  const queryFn = () => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (divisionFilter !== 'All') params.append('division', divisionFilter);
    if (houseFilter !== 'All') params.append('house', houseFilter);
    if (tagFilter !== 'All') params.append('tag', tagFilter);
    if (searchTerm) params.append('search', searchTerm);
    if (cursor) params.append('cursor', cursor);
    return api<{ items: Question[]; next: string | null }>(`/api/questions?${params.toString()}`);
  };
  return useQuery<{ items: Question[]; next: string | null }>({
    queryKey,
    queryFn,
    enabled,
  });
}