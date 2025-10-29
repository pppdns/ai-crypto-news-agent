'use client';

import { Card, CardHeader } from '@heroui/react';
import PromptContainerWithConversation from '@/components/chat/prompt-container-with-conversation';

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 p-4 pb-12 sm:p-12">
      <Card className="mx-auto max-w-7xl p-6">
        <CardHeader className="mb-4 flex-col items-start gap-2 border-b border-slate-200 pb-4">
          <p className="text-2xl font-bold">AI Crypto News Agent</p>
        </CardHeader>
        <PromptContainerWithConversation />
      </Card>
    </div>
  );
}
