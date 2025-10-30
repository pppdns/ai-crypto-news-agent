import { Spinner } from '@heroui/react';
import sanitizeHtml from 'sanitize-html';
import { markdownToHTML } from '@/lib/client/markdown-to-html';
import { Citation, Citations } from './citations';
import MessageCard from './message-card';

const avatars = {
  assistant: '/avatar-agent.svg',
  user: '/avatar-user.svg',
};

interface ConversationProps {
  userQuestion?: string;
  assistantAnswer?: string;
  isLoading: boolean;
  citations?: Citation[];
}

export default function Component({ userQuestion, assistantAnswer, isLoading, citations = [] }: ConversationProps) {
  return (
    <div className="flex flex-col gap-4 px-1">
      {/* Render user message */}
      {userQuestion && (
        <MessageCard
          avatar={avatars.user}
          message={<span>{userQuestion}</span>}
          messageClassName="bg-blue-100 text-gray-800 md:p-0 md:px-6"
        />
      )}

      {/* Render assistant message */}
      {assistantAnswer && (
        <MessageCard
          avatar={avatars.assistant}
          message={
            <div>
              <div
                className="markdown-content mb-9"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHTML(assistantAnswer)) }}
              />
              <Citations citations={citations} />
            </div>
          }
          messageClassName="bg-gray-100 text-gray-800"
        />
      )}

      {/* Loading state */}
      {isLoading && userQuestion && !assistantAnswer && (
        <MessageCard
          avatar={avatars.assistant}
          message={
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-gray-600">Agent is thinking...</span>
            </div>
          }
          messageClassName="bg-gray-200 text-gray-800"
        />
      )}
    </div>
  );
}
