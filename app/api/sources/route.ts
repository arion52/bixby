import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET all RSS sources
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching RSS sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS sources' },
      { status: 500 }
    );
  }
}

// POST a new RSS source
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, name, category } = body;

    if (!url || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: url, name, category' },
        { status: 400 }
      );
    }

    const { data, error} = await supabaseAdmin
      .from('rss_sources')
      .insert({ url, name, category })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating RSS source:', error);
    return NextResponse.json(
      { error: 'Failed to create RSS source' },
      { status: 500 }
    );
  }
}
