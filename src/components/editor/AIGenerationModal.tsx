'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (content: string) => void;
  selectedNodeId: string | null;
  selectedNodeType: 'start' | 'story' | 'end' | null;
}

interface GenerationParams {
  theme: string;
  tone: 'neutral' | 'dark' | 'humorous';
  length: number;
  additionalNotes: string;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  selectedNodeId,
  selectedNodeType,
}) => {
  const [params, setParams] = useState<GenerationParams>({
    theme: '',
    tone: 'neutral',
    length: 200,
    additionalNotes: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setParams({
        theme: '',
        tone: 'neutral',
        length: 200,
        additionalNotes: '',
      });
      setError(null);
      setGeneratedContent('');
    }
  }, [isOpen]);

  const toneOptions = [
    { value: 'neutral', label: 'Neutral', description: 'Balanced and versatile' },
    { value: 'dark', label: 'Dark', description: 'Mysterious and intense' },
    { value: 'humorous', label: 'Humorous', description: 'Light and funny' },
  ] as const;

  const getNodeTypeContext = () => {
    switch (selectedNodeType) {
      case 'start':
        return 'This is a starting node - create an engaging opening that sets the scene and introduces the story.';
      case 'end':
        return 'This is an ending node - create a satisfying conclusion that wraps up the story.';
      case 'story':
        return 'This is a story node - create a narrative scene that advances the plot and provides meaningful choices.';
      default:
        return 'Create compelling story content.';
    }
  };

  const generateWithAI = async () => {
    if (!params.theme.trim()) {
      setError('Please provide a story theme.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: params.theme,
          tone: params.tone,
          length: params.length,
          additionalNotes: params.additionalNotes,
          nodeType: selectedNodeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      setGeneratedContent(data.content);
      console.log('✅ AI generation successful:', {
        wordCount: data.wordCount,
        tokensUsed: data.tokensUsed,
      });
    } catch (err) {
      console.error('❌ AI Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story content. Please try again.';
      
      // Show specific error messages for common issues
      if (errorMessage.includes('API key')) {
        setError('OpenAI API key is missing or invalid. Please check your configuration.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Rate limit exceeded. Please wait a moment before trying again.');
      } else if (errorMessage.includes('quota')) {
        setError('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
      
      // Fallback to demo content in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const fallbackResponse = await simulateAIGeneration('', params.length);
          setGeneratedContent(fallbackResponse);
          setError('Using demo content - OpenAI API not available. Configure your API key for full functionality.');
        } catch (fallbackErr) {
          // Keep the original error if fallback also fails
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulate AI generation - replace this with your actual AI API
  const simulateAIGeneration = async (prompt: string, targetLength: number): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate sample content based on parameters
    const samples = {
      start: {
        neutral: `<p>The ancient door creaks open before you, revealing a dimly lit corridor that stretches into darkness. The air is thick with the scent of old parchment and forgotten secrets.</p><p>Your footsteps echo softly against the stone floor as you step inside, the weight of countless untold stories pressing down from the shadows above. This is where your journey truly begins.</p>`,
        dark: `<p>Blood-red moonlight filters through the cracked windows of the abandoned mansion, casting twisted shadows across the dusty floor. The very walls seem to whisper of the horrors that once unfolded within these cursed halls.</p><p>You feel a chill run down your spine as you cross the threshold, knowing that some doors, once opened, can never be closed again.</p>`,
        humorous: `<p>You stand before the most ridiculously oversized door you've ever seen, complete with a doorbell that plays "The Entertainer" in off-key chimes. A sign reads: "Welcome to the Adventure! Please wipe your feet and try not to die."</p><p>Well, that's reassuring. You adjust your slightly-too-small adventuring hat and wonder if you should have brought a bigger sword... or maybe just a good insurance policy.</p>`
      },
      story: {
        neutral: `<p>The marketplace bustles with activity as merchants hawk their wares and travelers share tales from distant lands. You notice a hooded figure watching you intently from across the square.</p><p>The stranger's gaze never wavers, and you catch a glimpse of an ornate medallion hanging from their neck - the same symbol you've been searching for. This could be the break you've been waiting for.</p>`,
        dark: `<p>The ritual chamber pulses with an unnatural red glow, ancient symbols carved deep into the obsidian walls seeming to writhe in the flickering light. The cult leader raises the ceremonial dagger, its blade gleaming with fresh blood.</p><p>"The sacrifice must be completed," they intone, their voice echoing with otherworldly power. "Only then will the old gods return to claim what is rightfully theirs."</p>`,
        humorous: `<p>The dragon turns out to be surprisingly polite, offering you tea and biscuits while apologizing profusely for the whole "terrorizing the village" misunderstanding.</p><p>"You see," the dragon explains, adjusting his reading glasses, "I was just trying to get the villagers' attention about their terrible parking situation. Have you seen where they leave their carts?"</p>`
      },
      end: {
        neutral: `<p>As the sun sets over the kingdom you've helped to save, you reflect on the journey that brought you here. The battles fought, the friends made, the sacrifices endured - all have led to this moment of peace.</p><p>Your quest is complete, but you know that somewhere out there, new adventures await. For now, though, you're content to watch the stars emerge in the darkening sky, knowing that you've made a difference.</p>`,
        dark: `<p>The victory feels hollow as you stand among the ashes of what once was. Yes, you've defeated the evil that threatened the world, but at what cost? The silence around you speaks of sacrifices that can never be undone.</p><p>In saving everyone, you've lost everything that mattered to you. Perhaps this is the true price of heroism - to save the world while losing your own.</p>`,
        humorous: `<p>And so your epic quest comes to an end, not with a bang, but with a whimper... and a really good sandwich. Turns out the "ancient evil" was just a really grumpy baker who hadn't had lunch.</p><p>You've saved the day, gotten a fantastic recipe for sourdough, and made a new friend. Not bad for a Tuesday! Now if only you could figure out where you parked your horse...</p>`
      }
    };

    const nodeType = selectedNodeType || 'story';
    const content = samples[nodeType][params.tone] || samples.story.neutral;
    
    return content;
  };

  const handleGenerate = () => {
    generateWithAI();
  };

  const handleUseGenerated = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
      onClose();
    }
  };

  const handleRegenerateContent = () => {
    setGeneratedContent('');
    generateWithAI();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-600 p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Generate with AI
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedNodeId ? (
                      <>
                        Generating content for{' '}
                        <span className="capitalize text-green-400">
                          {selectedNodeType}
                        </span>{' '}
                        node
                      </>
                    ) : (
                      'No node selected'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedNodeId ? (
              <div className="py-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h3 className="mb-2 text-lg font-medium text-white">
                  No Node Selected
                </h3>
                <p className="text-gray-400">
                  Please select a node in the editor before generating content.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Parameters Form */}
                <div className="space-y-4">
                  {/* Story Theme */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Story Theme *
                    </label>
                    <input
                      type="text"
                      value={params.theme}
                      onChange={(e) =>
                        setParams({ ...params, theme: e.target.value })
                      }
                      placeholder="e.g., Medieval Adventure, Cyberpunk Mystery, Fantasy Quest"
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Tone
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {toneOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            setParams({ ...params, tone: option.value })
                          }
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            params.tone === option.value
                              ? 'border-green-500 bg-green-900/50'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-white">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Length */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Length: {params.length} words
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="25"
                      value={params.length}
                      onChange={(e) =>
                        setParams({ ...params, length: parseInt(e.target.value) })
                      }
                      className="w-full accent-green-500"
                    />
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>100 words</span>
                      <span>500 words</span>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={params.additionalNotes}
                      onChange={(e) =>
                        setParams({ ...params, additionalNotes: e.target.value })
                      }
                      placeholder="Any specific requirements, character details, or plot points..."
                      className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white transition-colors focus:border-green-500 focus:outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg border border-red-600 bg-red-900/50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400" />
                      <span className="text-red-300">{error}</span>
                    </div>
                  </div>
                )}

                {/* Generated Content Preview */}
                {generatedContent && (
                  <div className="rounded-lg border border-green-600 bg-green-900/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-green-400">
                        Generated Content
                      </h3>
                      <button
                        onClick={handleRegenerateContent}
                        disabled={isGenerating}
                        className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white transition-colors hover:bg-green-700 disabled:bg-gray-600"
                      >
                        <RefreshCw size={12} />
                        Regenerate
                      </button>
                    </div>
                    <div
                      className="prose prose-invert prose-sm max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: generatedContent }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedNodeId && (
            <div className="border-t border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {generatedContent
                    ? 'Content ready to apply'
                    : 'Configure parameters and generate content'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  {generatedContent ? (
                    <button
                      onClick={handleUseGenerated}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
                    >
                      <Sparkles size={16} />
                      Use This Content
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!params.theme.trim() || isGenerating}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:bg-gray-600"
                    >
                      {isGenerating ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate Content
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};