import { Spinner } from '@heroui/react';
import { UIMessage } from 'ai';
import sanitizeHtml from 'sanitize-html';
import { markdownToHTML } from '@/lib/client/markdown-to-html';
import { Citation, Citations } from './citations';
import MessageCard from './message-card';

const avatars = {
  assistant: '/avatar-agent.svg',
  user: '/avatar-user.svg',
};

interface ConversationProps {
  messages: UIMessage[];
  isLoading: boolean;
  citations?: Citation[];
}

export default function Component({ messages, isLoading, citations = [] }: ConversationProps) {
  // For single-turn conversation, only show the last user and assistant message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const displayMessages = [lastUserMessage, lastAssistantMessage].filter(Boolean) as UIMessage[];

  return (
    <div className="flex flex-col gap-4 px-1">
      {displayMessages.map((message) => {
        // Render user message
        if (message.role === 'user') {
          const textParts = message.parts.filter((part) => part.type === 'text');
          return (
            <MessageCard
              key={message.id}
              avatar={avatars.user}
              message={textParts.map((part, idx) => (
                <span key={idx}>{part.type === 'text' ? part.text : ''}</span>
              ))}
              messageClassName="bg-blue-100 text-gray-800 md:p-0 md:px-6"
            />
          );
        }

        // Render assistant message
        if (message.role === 'assistant') {
          const textParts = message.parts.filter((part) => part.type === 'text');
          const markdownContent = textParts.map((part) => (part.type === 'text' ? part.text : '')).join('');
          const htmlContent = sanitizeHtml(markdownToHTML(markdownContent));

          return (
            <MessageCard
              key={message.id}
              avatar={avatars.assistant}
              message={
                <div>
                  <div className="markdown-content mb-9" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  <Citations citations={citations} />
                </div>
              }
              messageClassName="bg-gray-100 text-gray-800"
            />
          );
        }

        return null;
      })}

      {isLoading && lastUserMessage && !lastAssistantMessage && (
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
