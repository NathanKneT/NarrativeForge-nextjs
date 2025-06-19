// src/app/page.tsx - Fixed for SSR and async loading
'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Plus, FileText, Book, Star, Clock, Users, Upload, 
  Download, Trash2, Edit, Eye, Settings 
} from 'lucide-react';
import { dynamicStoryManager, StoryListItem } from '@/lib/dynamicStoryManager';

const ClientOnlyGame = dynamic(
  () => import('@/components/ClientOnlyGame').then((mod) => ({
    default: mod.ClientOnlyGame,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-xl text-white">Loading story...</div>
      </div>
    ),
  }
);

export default function HomePage() {
  const [selectedStory, setSelectedStory] = useState<StoryListItem | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'play' | 'create'>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [availableStories, setAvailableStories] = useState<StoryListItem[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load available stories on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadStories();
      
      // 🔧 FIX: Check for test story parameter
      const urlParams = new URLSearchParams(window.location.search);
      const testStoryId = urlParams.get('testStory');
      
      if (testStoryId) {
        // Automatically load the test story
        setTimeout(async () => {
          try {
            const testStory = await dynamicStoryManager.getStory(testStoryId);
            if (testStory) {
              console.log('🧪 Loading test story:', testStory.metadata.title);
              setSelectedStory({
                id: testStory.metadata.id,
                title: testStory.metadata.title,
                description: testStory.metadata.description,
                author: testStory.metadata.author,
                difficulty: testStory.metadata.difficulty,
                tags: testStory.metadata.tags,
                rating: testStory.metadata.rating,
                featured: testStory.metadata.featured || false,
                createdAt: testStory.metadata.createdAt,
                updatedAt: testStory.metadata.updatedAt,
                estimatedPlayTime: testStory.metadata.estimatedPlayTime,
                totalNodes: testStory.metadata.totalNodes,
                published: testStory.metadata.published
              });
              setGameMode('play');
              
              // Clean URL
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('testStory');
              window.history.replaceState({}, '', newUrl.toString());
            }
          } catch (error) {
            console.error('Failed to load test story:', error);
          }
        }, 500);
      }
    }
  }, []);

  const loadStories = async () => {
    try {
      const stories = await dynamicStoryManager.getPublishedStories();
      setAvailableStories(stories);
      setIsInitialized(true);
      console.log('📚 Loaded stories:', stories.length);
    } catch (error) {
      console.error('Failed to load stories:', error);
      setAvailableStories([]);
      setIsInitialized(true);
    }
  };

  const handlePlayStory = async (story: StoryListItem) => {
    setIsLoading(true);
    try {
      // Verify story exists and is loadable
      const fullStory = await dynamicStoryManager.getStory(story.id);
      if (!fullStory) {
        throw new Error('Story not found');
      }
      
      setSelectedStory(story);
      setGameMode('play');
    } catch (error) {
      console.error('Failed to load story:', error);
      alert('Failed to load story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
    setSelectedStory(null);
    loadStories(); // Refresh stories list
  };

  const handleCreateStory = () => {
    window.location.href = '/editor';
  };

  const handleImportStory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const storyId = await dynamicStoryManager.importStoryFromFile(file);
        await loadStories();
        alert(`Story imported successfully! ID: ${storyId}`);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import story. Please check the file format.');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleExportStory = async (storyId: string, title: string) => {
    try {
      const blob = await dynamicStoryManager.exportStory(storyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export story.');
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dynamicStoryManager.deleteStory(storyId);
      await loadStories();
      alert('Story deleted successfully.');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete story.');
    }
  };

  const handleTogglePublication = async (storyId: string) => {
    try {
      await dynamicStoryManager.toggleStoryPublication(storyId);
      await loadStories();
    } catch (error) {
      console.error('Failed to toggle publication:', error);
      alert('Failed to update story publication status.');
    }
  };

  if (gameMode === 'play' && selectedStory) {
    return <ClientOnlyGame storyId={selectedStory.id} onBack={handleBackToMenu} />;
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-blue-500 border-t-transparent mx-auto"></div>
          <div className="text-xl text-white">Loading Story Library...</div>
          <div className="mt-2 text-sm text-gray-400">Initializing stories...</div>
        </div>
      </div>
    );
  }

  const featuredStories = availableStories.filter(story => story.featured);
  const allPublishedStories = availableStories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 py-16">
        <div className="absolute inset-0 bg-black/30"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative container mx-auto px-4 text-center"
        >
          <h1 className="mb-4 text-6xl font-bold text-white tracking-wide">
            Interactive Stories
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-200">
            Create and experience immersive branching narratives where every choice matters. 
            Build your own adventures or explore existing tales.
          </p>
        </motion.div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={handleCreateStory}
            className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-white font-medium transition-all hover:from-purple-700 hover:to-blue-700 hover:scale-105 shadow-lg"
          >
            <Plus size={24} />
            Create New Story
          </button>
          
          <button
            onClick={handleImportStory}
            disabled={isImporting}
            className="flex items-center gap-3 rounded-lg bg-green-600 px-8 py-4 text-white font-medium transition-all hover:bg-green-700 hover:scale-105 shadow-lg disabled:opacity-50"
          >
            <Upload size={24} />
            {isImporting ? 'Importing...' : 'Import Story'}
          </button>

          <button
            onClick={() => setShowManagement(!showManagement)}
            className="flex items-center gap-3 rounded-lg bg-gray-700 px-8 py-4 text-white font-medium transition-all hover:bg-gray-600 hover:scale-105 shadow-lg"
          >
            <Settings size={24} />
            Manage Stories
          </button>
        </motion.div>

        {/* Story Management Panel */}
        {showManagement && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-12 rounded-xl bg-gray-800 p-6"
          >
            <h3 className="mb-6 text-2xl font-bold text-white">Story Management</h3>
            
            {availableStories.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No stories found. Create your first story!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableStories.map((story) => (
                  <div key={story.id} className="flex items-center justify-between rounded-lg bg-gray-700 p-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{story.title}</h4>
                      <p className="text-sm text-gray-300">{story.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span>By {story.author}</span>
                        <span>{story.totalNodes} scenes</span>
                        <span>{story.difficulty}</span>
                        <span className={story.published ? 'text-green-400' : 'text-yellow-400'}>
                          {story.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublication(story.id)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          story.published 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={story.published ? 'Unpublish' : 'Publish'}
                      >
                        <Eye size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleExportStory(story.id, story.title)}
                        className="rounded bg-blue-600 px-3 py-1 text-white transition-colors hover:bg-blue-700"
                        title="Export"
                      >
                        <Download size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteStory(story.id, story.title)}
                        className="rounded bg-red-600 px-3 py-1 text-white transition-colors hover:bg-red-700"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Featured Stories */}
        {featuredStories.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="mb-8 text-3xl font-bold text-white text-center">Featured Stories</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl bg-gray-800 p-6 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  {/* Featured Badge */}
                  <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-black">
                    <Star size={12} className="inline mr-1" />
                    FEATURED
                  </div>

                  <div className="mb-4">
                    <h3 className="mb-2 text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {story.description}
                    </p>
                  </div>

                  {/* Story Meta */}
                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={14} />
                      <span>By {story.author}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{story.estimatedPlayTime}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Book size={14} />
                        <span>{story.totalNodes} scenes</span>
                      </div>
                    </div>

                    {story.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < Math.floor(story.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'} 
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">({story.rating})</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {story.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {story.tags.length > 3 && (
                        <span className="rounded-full bg-gray-600 px-3 py-1 text-xs text-gray-300">
                          +{story.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Difficulty Badge */}
                  <div className="mb-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      story.difficulty === 'Easy' ? 'bg-green-600 text-white' :
                      story.difficulty === 'Medium' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {story.difficulty}
                    </span>
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayStory(story)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Play size={18} />
                        Play Story
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* All Stories */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="mb-8 text-3xl font-bold text-white text-center">
            {featuredStories.length > 0 ? 'All Stories' : 'Available Stories'}
          </h2>
          
          {allPublishedStories.length === 0 ? (
            <div className="text-center py-16">
              <Book size={64} className="mx-auto mb-6 text-gray-600" />
              <h3 className="mb-4 text-2xl font-bold text-white">No Stories Available</h3>
              <p className="mb-8 text-gray-400 max-w-md mx-auto">
                Get started by creating your first interactive story or importing an existing one.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleCreateStory}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white font-medium transition-all hover:bg-purple-700"
                >
                  <Plus size={20} />
                  Create First Story
                </button>
                <button
                  onClick={handleImportStory}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white font-medium transition-all hover:bg-green-700"
                >
                  <Upload size={20} />
                  Import Story
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {allPublishedStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="group rounded-lg bg-gray-800 p-4 transition-all hover:bg-gray-700 hover:scale-102"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    {story.featured && (
                      <Star size={16} className="text-yellow-400 fill-current ml-2 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="mb-3 text-sm text-gray-400 line-clamp-2">
                    {story.description}
                  </p>
                  
                  <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{story.estimatedPlayTime}</span>
                    <span>{story.difficulty}</span>
                  </div>

                  <div className="mb-3 text-xs text-gray-500">
                    By {story.author} • {story.totalNodes} scenes
                  </div>
                  
                  <button
                    onClick={() => handlePlayStory(story)}
                    disabled={isLoading}
                    className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Play'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Getting Started Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <div className="grid gap-8 md:grid-cols-2">
            {/* Create Stories */}
            <div className="rounded-xl bg-gradient-to-br from-purple-800 to-blue-800 p-8">
              <h3 className="mb-4 text-2xl font-bold text-white">Create Your Own Stories</h3>
              <p className="mb-6 text-gray-200">
                Use our visual editor to craft branching narratives with an intuitive node-based interface. 
                No coding required - just drag, connect, and tell your story.
              </p>
              <button
                onClick={handleCreateStory}
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-purple-800 transition-all hover:bg-gray-100"
              >
                <Edit size={20} />
                Open Story Editor
              </button>
            </div>

            {/* Import Stories */}
            <div className="rounded-xl bg-gradient-to-br from-green-800 to-teal-800 p-8">
              <h3 className="mb-4 text-2xl font-bold text-white">Import Existing Stories</h3>
              <p className="mb-6 text-gray-200">
                Have a story in JSON format? Import it directly into the platform. 
                Compatible with our export format and many interactive fiction formats.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleImportStory}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-green-800 transition-all hover:bg-gray-100 disabled:opacity-50"
                >
                  <Upload size={20} />
                  {isImporting ? 'Importing...' : 'Import JSON'}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Platform Info */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-16 text-center"
        >
          <div className="rounded-xl bg-gray-800 p-8">
            <h3 className="mb-4 text-2xl font-bold text-white">Platform Features</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <Edit size={24} className="text-white" />
                </div>
                <h4 className="mb-2 font-bold text-white">Visual Editor</h4>
                <p className="text-sm text-gray-400">
                  Drag-and-drop story creation with real-time preview
                </p>
              </div>
              <div>
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <h4 className="mb-2 font-bold text-white">Story Management</h4>
                <p className="text-sm text-gray-400">
                  Organize, publish, and share your interactive stories
                </p>
              </div>
              <div>
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <Play size={24} className="text-white" />
                </div>
                <h4 className="mb-2 font-bold text-white">Immersive Player</h4>
                <p className="text-sm text-gray-400">
                  Rich reading experience with save/load and progress tracking
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}