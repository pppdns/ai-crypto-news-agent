/**
 * Home page (/): the chat UI. Index stats (article count, latest headlines) are read on
 * the server for each request and passed to the client chat.
 */
import { Chat } from '@/components/chat/chat';
import { getIndexStats } from '@/lib/server/index-stats';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getIndexStats();
  return <Chat stats={stats} />;
}
