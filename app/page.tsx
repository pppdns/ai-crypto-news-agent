'use client';

import Link from 'next/link';
import { Button, Card, CardHeader } from '@heroui/react';
import { Newspaper } from 'lucide-react';
import PromptContainerWithConversation from '@/components/chat/prompt-container-with-conversation';

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 p-4 pb-12 sm:p-12">
      <Card className="mx-auto max-w-7xl p-6">
        <CardHeader className="mb-4 flex-row flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">Ask a Question</p>
            <p className="text-sm text-slate-600">Get answers about the latest cryptocurrency news</p>
          </div>
          <Button
            as={Link}
            href="/news"
            variant="flat"
            color="primary"
            startContent={<Newspaper className="h-4 w-4 shrink-0" />}
            className="shrink-0"
          >
            List All Articles
          </Button>
        </CardHeader>
        <PromptContainerWithConversation />
      </Card>
    </div>
  );
}
