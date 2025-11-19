import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: items, error } = await supabase
      .from('digest_items')
      .select('*')
      .eq('is_favorited', true)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
