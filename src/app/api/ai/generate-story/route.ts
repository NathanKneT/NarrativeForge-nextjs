import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationParams {
  theme: string;
  tone: 'neutral' | 'dark' | 'humorous';
  length: number;
  additionalNotes: string;
  nodeType: 'start' | 'story' | 'end';
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationParams = await request.json();
    const { theme, tone, length, additionalNotes, nodeType } = body;

    // Validate required fields
    if (!theme || !tone || !length || !nodeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = createPrompt({ theme, tone, length, additionalNotes, nodeType });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative writing assistant specialized in interactive storytelling. Generate engaging, immersive story content that naturally leads to player choices. Always format your output as clean HTML with proper paragraph tags."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: Math.ceil(length * 1.5), // Allow some buffer for longer content
      temperature: getTemperatureForTone(tone),
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Basic validation of generated content
    if (content.length < 50) {
      throw new Error('Generated content too short');
    }

    // Ensure HTML formatting
    const formattedContent = ensureHTMLFormatting(content);

    return NextResponse.json({
      content: formattedContent,
      wordCount: countWords(formattedContent),
      tokensUsed: completion.usage?.total_tokens || 0
    });
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'OpenAI quota exceeded' },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}

function createPrompt(params: GenerationParams): string {
  const nodeTypeContext = {
    start: 'This is a starting node - create an engaging opening that sets the scene and introduces the story. End with a moment that naturally leads to player choices.',
    end: 'This is an ending node - create a satisfying conclusion that wraps up the story thread. This should feel final and complete.',
    story: 'This is a story node - create a narrative scene that advances the plot and provides meaningful development. End with a moment that naturally leads to choices.',
  };

  const toneGuidelines = {
    neutral: 'Use balanced, versatile language that can appeal to a wide audience. Focus on clear storytelling.',
    dark: 'Use mysterious, intense, and atmospheric language. Create tension and unease. Include shadows, mystery, and foreboding elements.',
    humorous: 'Use light, funny, and entertaining language. Include wit, clever observations, and amusing situations while maintaining story coherence.',
  };

  return `Create ${params.nodeType === 'end' ? 'an ending scene' : 'a story scene'} for an interactive story with these specifications:

**Story Theme:** ${params.theme}
**Tone:** ${params.tone} - ${toneGuidelines[params.tone]}
**Target Length:** ${params.length} words
**Node Type:** ${params.nodeType}
**Context:** ${nodeTypeContext[params.nodeType]}
${params.additionalNotes ? `**Additional Requirements:** ${params.additionalNotes}` : ''}

**Writing Requirements:**
- Write engaging, immersive content that draws readers in
- Use descriptive language that matches the ${params.tone} tone
- Keep the content around ${params.length} words (${Math.floor(params.length * 0.8)}-${Math.ceil(params.length * 1.2)} words acceptable)
- Format as clean HTML with proper paragraph tags (<p></p>)
- ${params.nodeType !== 'end' ? 'End with a compelling moment that naturally leads to player choices' : 'Provide a satisfying and complete conclusion'}
- Make every sentence count - this is interactive fiction, so maintain engagement
- Use present tense and second person perspective when appropriate
- Create vivid imagery that helps players visualize the scene

**Output Format:**
Return only the story content as properly formatted HTML. No meta-commentary, explanations, or additional text outside the story.`;
}

function getTemperatureForTone(tone: string): number {
  switch (tone) {
    case 'humorous':
      return 0.8; // Higher creativity for humor
    case 'dark':
      return 0.6; // Controlled creativity for atmosphere
    case 'neutral':
    default:
      return 0.7; // Balanced creativity
  }
}

function ensureHTMLFormatting(content: string): string {
  // Remove any existing HTML tags to start clean
  let cleaned = content.replace(/<[^>]*>/g, '');
  
  // Split into paragraphs based on double line breaks
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // Wrap each paragraph in <p> tags
  const htmlContent = paragraphs
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('\n');
  
  return htmlContent;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
}