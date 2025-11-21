import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, name, category } = body;

    if (!url || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: url, name, category' },
        { status: 400 }
      );
    }

    // Get user profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    const { data, error} = await supabaseAdmin
      .from('rss_sources')
      // @ts-expect-error Insert type requires all fields but we let DB handle defaults
      .insert({ url, name, category, user_id: profile?.id })
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
