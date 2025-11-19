import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json([]);
    }

    // Search in title and summary using ilike (case-insensitive pattern matching)
    const { data, error } = await supabase
      .from('digest_items')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
