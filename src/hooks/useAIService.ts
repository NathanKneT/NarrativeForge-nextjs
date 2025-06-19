import { useState, useCallback } from 'react';

export interface GenerationParams {
  theme: string;
  tone: 'neutral' | 'dark' | 'humorous';
  length: number;
  additionalNotes: string;
  nodeType: 'start' | 'story' | 'end';
}

export interface AIServiceResponse {
  content: string;
  wordCount: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

export const useAIService = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneration, setLastGeneration] = useState<AIServiceResponse | null>(null);

  const generateStoryContent = useCallback(async (params: GenerationParams): Promise<AIServiceResponse> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🤖 Generating AI content with params:', params);

      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      const result: AIServiceResponse = {
        content: data.content,
        wordCount: data.wordCount || 0,
        tokensUsed: data.tokensUsed,
        success: true,
      };

      setLastGeneration(result);
      console.log('✅ AI generation successful:', {
        wordCount: result.wordCount,
        tokensUsed: result.tokensUsed,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      console.error('❌ AI generation failed:', errorMessage);

      const result: AIServiceResponse = {
        content: '',
        wordCount: 0,
        success: false,
        error: errorMessage,
      };

      return result;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUsageStats = useCallback(() => {
    return {
      lastGeneration,
      isGenerating,
      hasError: !!error,
    };
  }, [lastGeneration, isGenerating, error]);

  return {
    generateStoryContent,
    isGenerating,
    error,
    clearError,
    getUsageStats,
  };
};