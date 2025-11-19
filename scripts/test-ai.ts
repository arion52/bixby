import { processWithAI } from '@/lib/ai';

async function testAI() {
  console.log('Testing AI processing...');
  
  const mockArticles = [
    {
      title: 'New F1 Regulations for 2026',
      summary: 'The FIA has announced new regulations for the 2026 season focusing on sustainable fuels.',
      url: 'https://example.com/f1',
      source: 'The Race',
      category: 'f1'
    },
    {
      title: 'Next.js 15 Released',
      summary: 'Vercel has released Next.js 15 with improved caching and partial prerendering.',
      url: 'https://example.com/nextjs',
      source: 'Vercel',
      category: 'dev_tools'
    },
    {
      title: '10 Ways to Bake a Cake',
      summary: 'Here are the best recipes for chocolate cake.',
      url: 'https://example.com/cake',
      source: 'Food Blog',
      category: 'misc'
    }
  ];

  try {
    const result = await processWithAI(mockArticles);
    console.log('Processed items:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('AI processing error:', error);
  }
}

testAI();
