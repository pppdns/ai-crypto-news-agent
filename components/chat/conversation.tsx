import MessageCard from './message-card';
import { assistantMessage, userMessage } from './messages';

const avatars = {
  assistant: '/avatar-agent.svg',
  user: '/avatar-user.svg',
};

type Message = {
  role: 'user' | 'assistant';
  message: React.ReactNode;
};

export default function Component() {
  const messages: Message[] = [
    {
      role: 'user',
      message: userMessage,
    },
    {
      role: 'assistant',
      message: assistantMessage,
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-1">
      {messages.map(({ role, message }) => (
        <MessageCard
          key={role}
          avatar={role === 'assistant' ? avatars.assistant : avatars.user}
          message={message}
          messageClassName={role === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}
        />
      ))}
    </div>
  );
}
