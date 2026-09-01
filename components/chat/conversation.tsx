import sanitizeHtml from 'sanitize-html';
import { markdownToHTML } from '@/lib/client/markdown-to-html';
import { Citation, Citations } from './citations';
import MessageCard from './message-card';

interface ConversationProps {
  userQuestion?: string;
  assistantAnswer?: string;
  isLoading: boolean;
  citations?: Citation[];
}

export default function Conversation({ userQuestion, assistantAnswer, isLoading, citations = [] }: ConversationProps) {
  return (
    <div className="flex flex-col gap-8">
      {userQuestion && (
        <MessageCard speaker="user" message={<p className="text-ink text-[16px] tracking-tight">{userQuestion}</p>} />
      )}

      {assistantAnswer && (
        <MessageCard
          speaker="assistant"
          message={
            <div>
              <div
                className="markdown-content text-ink text-[15px] leading-[1.65]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHTML(assistantAnswer)) }}
              />
              <Citations citations={citations} />
            </div>
          }
        />
      )}

      {isLoading && userQuestion && !assistantAnswer && (
        <MessageCard
          speaker="assistant"
          message={
            <div className="flex min-h-11 items-center gap-2.5">
              <span className="status-dot" aria-hidden />
              <span className="text-muted font-mono text-[11px] tracking-[0.16em]">RETRIEVING</span>
            </div>
          }
        />
      )}
    </div>
  );
}
