import { fetchAllReddit } from '@/lib/sources/reddit';
import { fetchF1RSS, fetchMLRSS, fetchTechRSS } from '@/lib/sources/rss';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [f1, tech, ml, reddit] = await Promise.all([
      fetchF1RSS(),
      fetchTechRSS(),
      fetchMLRSS(),
      fetchAllReddit(),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        f1: f1.length,
        tech: tech.length,
        ml: ml.length,
        reddit: reddit.length,
      },
      samples: {
        f1: f1.slice(0, 2),
        tech: tech.slice(0, 2),
        ml: ml.slice(0, 2),
        reddit: reddit.slice(0, 2),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
