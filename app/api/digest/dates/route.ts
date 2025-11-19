import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get distinct dates that have digest items
    const { data, error } = await supabase
      .from('digest_items')
      .select('date')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching digest dates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch digest dates' },
        { status: 500 }
      );
    }

    // Extract unique dates
    const uniqueDates = [...new Set(data?.map(item => item.date) || [])];

    return NextResponse.json(uniqueDates);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
