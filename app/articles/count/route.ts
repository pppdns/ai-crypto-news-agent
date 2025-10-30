import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/server/supabase';

/**
 * GET /articles/count
 * Returns the total number of articles in the database
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching article count:', error);
      return NextResponse.json({ error: 'Failed to fetch article count' }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error('Unexpected error in article count route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
