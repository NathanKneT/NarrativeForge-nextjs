import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BulkGenerationParams {
  theme: string;
  genre: 'fantasy' | 'sci-fi' | 'horror' | 'mystery' | 'romance' | 'adventure' | 'thriller';
  tone: 'neutral' | 'dark' | 'humorous';
  complexity: 'simple' | 'medium' | 'complex';
  nodeCount: number;
  branchingFactor: number;
  description: string;
}

interface GeneratedNode {
  id: string;
  type: 'start' | 'story' | 'end';
  title: string;
  content: string;
  choices: Array<{
    id: string;
    text: string;
    nextNodeId: string;
  }>;
  position: { x: number; y: number };
}

interface GeneratedStoryStructure {
  nodes: GeneratedNode[];
  metadata: {
    title: string;
    description: string;
    theme: string;
    genre: string;
    estimatedPlayTime: string;
    totalNodes: number;
    totalChoices: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const params: BulkGenerationParams = await request.json();
    const { theme, genre, tone, complexity, nodeCount, branchingFactor, description } = params;

    // Validate required fields
    if (!theme || !genre || !tone || !complexity) {
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

    console.log('🤖 Starting bulk story generation with GPT-4.1 Mini:', {
      theme,
      genre,
      complexity,
      nodeCount,
      branchingFactor
    });

    // Create the story generation prompt
    const storyPrompt = createBulkStoryPrompt(params);

    // ✅ Use GPT-4.1 Mini with JSON response format support
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: "You are an expert interactive fiction writer and game designer. You create engaging, well-structured interactive stories with meaningful choices and compelling narratives. You must respond with valid JSON that follows the exact structure requested."
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      max_tokens: 4000, // Large token limit for bulk generation
      temperature: 0.7,
      response_format: { type: "json_object" }, // ✅ Now supported with GPT-4.1 Mini
    });

    const rawContent = completion.choices[0]?.message?.content || '';
    
    if (!rawContent) {
      throw new Error('No content generated');
    }

    console.log('🔍 Generated content length:', rawContent.length);

    // Parse the JSON response
    let storyData;
    try {
      storyData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content preview:', rawContent.substring(0, 500));
      throw new Error('Invalid JSON response from AI');
    }

    // Validate and process the story structure
    const storyStructure = processGeneratedStory(storyData, params);

    console.log('✅ Bulk story generation completed:', {
      title: storyStructure.metadata.title,
      nodes: storyStructure.nodes.length,
      totalChoices: storyStructure.metadata.totalChoices,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    return NextResponse.json({
      storyStructure,
      tokensUsed: completion.usage?.total_tokens || 0,
      cost: calculateCost(completion.usage?.total_tokens || 0) // ✅ Show cost for transparency
    });

  } catch (error) {
    console.error('Bulk story generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
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
      if (error.message.includes('response_format')) {
        return NextResponse.json(
          { error: 'JSON response format not supported by this model. Please update to GPT-4.1 Mini.' },
          { status: 400 }
        );
      }
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'AI generated invalid format. Please try again with a different theme.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate bulk story. Please try again.' },
      { status: 500 }
    );
  }
}

function createBulkStoryPrompt(params: BulkGenerationParams): string {
  const complexityGuidelines = {
    simple: 'Create a mostly linear story with minimal branching. Most nodes should have 1-2 choices.',
    medium: 'Create a moderately branching story with multiple paths that may converge. Most nodes should have 2-3 choices.',
    complex: 'Create a heavily branching story with many different paths and multiple endings. Most nodes should have 2-4 choices.'
  };

  const genreGuidelines = {
    fantasy: 'Include magic, mythical creatures, ancient powers, and epic quests.',
    'sci-fi': 'Include advanced technology, space travel, aliens, or future societies.',
    horror: 'Include supernatural elements, tension, fear, and psychological thriller aspects.',
    mystery: 'Include puzzles, investigation, hidden clues, and revelations.',
    romance: 'Include relationships, emotional connections, and romantic tension.',
    adventure: 'Include action, exploration, heroic deeds, and exciting journeys.',
    thriller: 'Include high stakes, tension, danger, and fast-paced action.'
  };

  const toneGuidelines = {
    neutral: 'Use balanced, accessible language that appeals to a wide audience.',
    dark: 'Use serious, intense language with mature themes and atmospheric descriptions.',
    humorous: 'Use light-hearted, funny language with wit and entertaining situations.'
  };

  const endNodeCount = Math.max(2, Math.floor(params.nodeCount * 0.2));
  const storyNodeCount = params.nodeCount - 1 - endNodeCount;

  return `Create a complete interactive story structure as a JSON object with the following specifications:

**Story Parameters:**
- Theme: ${params.theme}
- Genre: ${params.genre} - ${genreGuidelines[params.genre]}
- Tone: ${params.tone} - ${toneGuidelines[params.tone]}
- Complexity: ${params.complexity} - ${complexityGuidelines[params.complexity]}
- Target Nodes: ${params.nodeCount}
- Branching Factor: ${params.branchingFactor} choices per node average
${params.description ? `- Additional Requirements: ${params.description}` : ''}

**Structure Requirements:**
1. Create exactly 1 start node (the story beginning)
2. Create ${endNodeCount} end nodes (story conclusions) with different outcomes
3. Create ${storyNodeCount} story nodes (narrative scenes)
4. Each story node should have ${params.branchingFactor} meaningful choices on average
5. Create a coherent narrative flow from start to multiple possible endings
6. Ensure all nodes are reachable from the start node
7. Each node should have 150-250 words of engaging content

**Content Guidelines:**
- Write compelling, immersive narrative content for each node
- Create meaningful choices that affect the story outcome
- Use proper character development and plot progression
- Include descriptive language that matches the ${params.tone} tone
- Make each choice feel impactful and interesting
- End nodes should provide satisfying conclusions

**Required JSON Structure:**
{
  "metadata": {
    "title": "Generated Story Title",
    "description": "Brief story description",
    "theme": "${params.theme}",
    "genre": "${params.genre}",
    "estimatedPlayTime": "X-Y minutes",
    "totalNodes": ${params.nodeCount},
    "totalChoices": 0
  },
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "title": "Story Beginning",
      "content": "<p>HTML formatted story content...</p>",
      "choices": [
        {
          "id": "choice-start-1",
          "text": "Choice description",
          "nextNodeId": "story-1"
        }
      ]
    },
    {
      "id": "story-1",
      "type": "story", 
      "title": "Scene Title",
      "content": "<p>HTML formatted story content...</p>",
      "choices": [
        {
          "id": "choice-story-1-1",
          "text": "Choice description",
          "nextNodeId": "story-2"
        },
        {
          "id": "choice-story-1-2",
          "text": "Another choice",
          "nextNodeId": "end-1"
        }
      ]
    },
    {
      "id": "end-1",
      "type": "end",
      "title": "Ending Title", 
      "content": "<p>HTML formatted conclusion...</p>",
      "choices": []
    }
  ]
}

**Important Notes:**
- Ensure all nextNodeId references point to valid node IDs
- Make story content engaging and appropriate for the ${params.tone} tone
- Create diverse and meaningful choices that lead to different outcomes
- End nodes should have empty choices arrays
- All content should be properly formatted HTML with <p> tags
- Use unique, descriptive titles for each node
- Make choices feel consequential and interesting

Generate the complete story now with exactly ${params.nodeCount} nodes total (1 start + ${storyNodeCount} story + ${endNodeCount} end nodes).`;
}

function processGeneratedStory(storyData: any, params: BulkGenerationParams): GeneratedStoryStructure {
  // Validate the structure
  if (!storyData.nodes || !Array.isArray(storyData.nodes)) {
    throw new Error('Invalid story structure: missing nodes array');
  }

  if (!storyData.metadata) {
    console.warn('Missing metadata, creating default');
    storyData.metadata = {};
  }

  // Validate node types
  const startNodes = storyData.nodes.filter((node: any) => node.type === 'start');
  const endNodes = storyData.nodes.filter((node: any) => node.type === 'end');

  if (startNodes.length !== 1) {
    console.warn(`Expected exactly 1 start node, got ${startNodes.length}. Using first node as start.`);
    if (startNodes.length === 0 && storyData.nodes.length > 0) {
      storyData.nodes[0].type = 'start';
    }
  }

  if (endNodes.length === 0) {
    console.warn('No end nodes found, converting last node to end node');
    if (storyData.nodes.length > 1) {
      storyData.nodes[storyData.nodes.length - 1].type = 'end';
      storyData.nodes[storyData.nodes.length - 1].choices = [];
    }
  }

  // Generate unique IDs if needed and clean up data
  const processedNodes = storyData.nodes.map((node: any, index: number) => {
    const nodeId = node.id || `${node.type || 'story'}-${index + 1}`;
    
    // Process choices and ensure unique IDs
    const processedChoices = (node.choices || []).map((choice: any, choiceIndex: number) => ({
      id: choice.id || `choice-${nodeId}-${choiceIndex + 1}`,
      text: choice.text || `Choice ${choiceIndex + 1}`,
      nextNodeId: choice.nextNodeId || (index < storyData.nodes.length - 1 ? storyData.nodes[index + 1].id : nodeId)
    }));

    return {
      id: nodeId,
      type: node.type || 'story',
      title: node.title || `${node.type || 'Story'} Node`,
      content: ensureHTMLFormatting(node.content || 'Content not generated.'),
      choices: node.type === 'end' ? [] : processedChoices
    };
  });

  // Generate positions for nodes using a smart layout algorithm
  const nodesWithPositions = generateNodePositions(processedNodes);

  // Count total choices
  const totalChoices = nodesWithPositions.reduce((sum, node) => 
    sum + (node.choices?.length || 0), 0
  );

  // Validate node connections (with warnings only)
  try {
    validateNodeConnections(nodesWithPositions);
  } catch (error) {
    console.warn('Story validation warning:', error);
    // Continue anyway - just warn
  }

  const processedStructure: GeneratedStoryStructure = {
    nodes: nodesWithPositions,
    metadata: {
      title: storyData.metadata.title || `Generated ${params.genre} Story`,
      description: storyData.metadata.description || `A ${params.tone} ${params.genre} interactive story`,
      theme: params.theme,
      genre: params.genre,
      estimatedPlayTime: storyData.metadata.estimatedPlayTime || `${Math.ceil(nodesWithPositions.length * 1.5)}-${Math.ceil(nodesWithPositions.length * 2)} minutes`,
      totalNodes: nodesWithPositions.length,
      totalChoices,
    },
  };

  return processedStructure;
}

function generateNodePositions(nodes: any[]): GeneratedNode[] {
  // Find start node
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];
  
  // Enhanced grid layout with better spacing
  return nodes.map((node, index) => {
    let x, y;
    
    if (node.type === 'start') {
      // Start node at top center
      x = 400;
      y = 100;
    } else if (node.type === 'end') {
      // End nodes at bottom
      const endNodes = nodes.filter(n => n.type === 'end');
      const endIndex = endNodes.findIndex(n => n.id === node.id);
      x = 200 + (endIndex * 400);
      y = 600;
    } else {
      // Story nodes in middle layers
      const storyNodes = nodes.filter(n => n.type === 'story');
      const storyIndex = storyNodes.findIndex(n => n.id === node.id);
      const row = Math.floor(storyIndex / 3) + 1;
      const col = storyIndex % 3;
      x = 150 + (col * 350);
      y = 200 + (row * 200);
    }
    
    return {
      id: node.id,
      type: node.type,
      title: node.title,
      content: node.content,
      choices: node.choices || [],
      position: { x, y }
    };
  });
}

function validateNodeConnections(nodes: GeneratedNode[]): void {
  const nodeIds = new Set(nodes.map(node => node.id));
  const errors: string[] = [];

  // Check that all choice targets exist
  nodes.forEach(node => {
    if (node.choices) {
      node.choices.forEach(choice => {
        if (!nodeIds.has(choice.nextNodeId)) {
          errors.push(`Node "${node.id}" references non-existent node "${choice.nextNodeId}"`);
        }
      });
    }
  });

  if (errors.length > 0) {
    throw new Error(`Story validation failed: ${errors.join(', ')}`);
  }
}

function ensureHTMLFormatting(content: string): string {
  if (!content) return '<p>Content not generated.</p>';
  
  // If already has HTML tags, return as is
  if (content.includes('<p>') || content.includes('<div>')) {
    return content;
  }
  
  // Split into paragraphs and wrap in <p> tags
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  if (paragraphs.length === 0) {
    return '<p>Content not generated.</p>';
  }
  
  return paragraphs
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('\n');
}

// ✅ Cost calculation for transparency (GPT-4.1 Mini pricing)
function calculateCost(tokens: number): string {
  const costPer1kTokens = 0.00015; // GPT-4.1 Mini: ~$0.15 per 1M tokens
  const cost = (tokens / 1000) * costPer1kTokens;
  return `$${cost.toFixed(6)}`;
}