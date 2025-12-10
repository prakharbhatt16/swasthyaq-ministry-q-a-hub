/**
 * Lightweight RecentQuestions component
 *
 * - Uses useQuestionsQuery hook (no router hooks or mutations)
 * - Renders a small grid of QuestionCard items with loading skeletons
 * - Provides a header with "Recent Questions" and "View all" link
 *
 * This component is safe to render on the HomePage and outside route contexts.
 */
import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestionsQuery } from "@/hooks/useQuestionsQuery";
import type { Question } from "@shared/types";
interface RecentQuestionsProps {
  limit?: number;
}
/**
 * RecentQuestions
 * @param {RecentQuestionsProps} props
 * @returns JSX.Element
 */
export default function RecentQuestions({ limit = 6 }: RecentQuestionsProps): JSX.Element {
  // Use the custom hook with only read-only query logic.
  // This hook uses react-query internally and is safe to call in render.
  const { data, isLoading, error } = useQuestionsQuery({
    limit,
    // Use default filters (All) and enable fetching
    enabled: true,
  });
  const items: Question[] = data?.items ?? [];
  return (
    <section className="w-full">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Questions</h2>
          <p className="text-sm text-muted-foreground">Latest inquiries from the house and divisions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/questions">View all</Link>
          </Button>
          <Button asChild size="sm" className="bg-[#F38020] hover:bg-[#d86d11] text-white">
            <Link to="/questions/new">
              <PlusCircle className="h-4 w-4 mr-2 inline" />
              New
            </Link>
          </Button>
        </div>
      </header>
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-destructive">
            Failed to load recent questions: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No recent questions available.</p>
            <div className="mt-4">
              <Button asChild className="bg-[#F38020] hover:bg-[#d86d11] text-white">
                <Link to="/questions/new">Create a Question</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                isSelected={false}
                onToggleSelect={() => {
                  /* no-op in this lightweight list; selection not supported here */
                }}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}