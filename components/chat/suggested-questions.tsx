/**
 * Suggested question pills. Shown under the composer on the empty state, and above the
 * pinned composer during a chat so users can try another question without typing.
 * Questions already asked in the current chat are left out.
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const SUGGESTED_QUESTIONS = [
  "What's new in crypto regulation?",
  'How did Bitcoin perform this week?',
  'Latest XRP news?',
  'Any major exchange hacks recently?',
] as const;

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
  /** Questions already asked in this chat; matching suggestions are hidden. */
  asked?: readonly string[];
  /** Smaller pills in a single scrollable row, for use above the pinned composer. */
  compact?: boolean;
  className?: string;
}

export function SuggestedQuestions({
  onSelect,
  disabled,
  asked = [],
  compact = false,
  className,
}: SuggestedQuestionsProps) {
  const askedSet = new Set(asked.map((question) => question.trim().toLowerCase()));
  const questions = SUGGESTED_QUESTIONS.filter((question) => !askedSet.has(question.toLowerCase()));

  if (questions.length === 0) return null;

  return (
    <ul
      aria-label="Suggested questions"
      className={cn(
        'flex gap-2',
        // Compact: one row that scrolls sideways on narrow screens instead of eating vertical space.
        compact ? '-mx-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0' : 'flex-wrap',
        className,
      )}
    >
      {questions.map((question) => (
        <li key={question} className="shrink-0">
          <Button
            variant="outline"
            className={cn(
              'text-muted-foreground hover:text-foreground h-auto rounded-full font-normal',
              compact ? 'px-3 py-1 text-xs whitespace-nowrap' : 'px-3.5 py-1.5 whitespace-normal',
            )}
            disabled={disabled}
            onClick={() => onSelect(question)}
          >
            {question}
          </Button>
        </li>
      ))}
    </ul>
  );
}
