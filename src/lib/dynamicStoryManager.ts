import { StoryNode } from '@/types/story';

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  estimatedPlayTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  thumbnail?: string;
  rating: number;
  totalNodes: number;
  featured?: boolean;
  published: boolean;
}

export interface StoryProject {
  metadata: StoryMetadata;
  story: StoryNode[];
  startNodeId: string;
}

export interface StoryListItem {
  id: string;
  title: string;
  description: string;
  author: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  rating: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  estimatedPlayTime: string;
  totalNodes: number;
  published: boolean;
}

export class DynamicStoryManager {
  private static instance: DynamicStoryManager;
  private readonly STORIES_KEY = 'interactive-stories-library';
  private readonly DEFAULT_STORY_KEY = 'asylum-default-story';
  private isInitialized = false;

  private constructor() {
    // Don't initialize immediately - wait for client side
  }

  static getInstance(): DynamicStoryManager {
    if (!DynamicStoryManager.instance) {
      DynamicStoryManager.instance = new DynamicStoryManager();
    }
    return DynamicStoryManager.instance;
  }

  /**
   * Initialize the story manager (client-side only)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      await this.initializeDefaultStory();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize story manager:', error);
    }
  }

  /**
   * Initialize with the default asylum story if no stories exist
   */
  private async initializeDefaultStory(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const existingStories = this.getAllStoryMetadataSync();
      
      // If no stories exist, create the default asylum story
      if (existingStories.length === 0) {
        console.log('🎯 No stories found, initializing with default asylum story...');
        
        // Import the default story data (only for initial setup)
        const defaultStoryData = await this.getDefaultAsylumStory();
        
        if (defaultStoryData) {
          await this.saveStory({
            metadata: {
              id: 'asylum',
              title: 'Asylum Interactive Story',
              description: 'An immersive psychological horror experience where you wake up in a mysterious asylum. Make choices that determine your fate in this dark, atmospheric tale.',
              author: 'Nathan RIHET',
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              estimatedPlayTime: '15-30 min',
              difficulty: 'Medium',
              tags: ['Horror', 'Psychological', 'Mystery'],
              rating: 4.5,
              totalNodes: defaultStoryData.length,
              featured: true,
              published: true
            },
            story: defaultStoryData,
            startNodeId: '1'
          });
          
          console.log('✅ Default asylum story initialized successfully');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize default story:', error);
    }
  }

  /**
   * Get the default asylum story data (only for initial setup)
   */
  private async getDefaultAsylumStory(): Promise<StoryNode[] | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Try to get from localStorage first (if it was saved before)
      const saved = localStorage.getItem(this.DEFAULT_STORY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }

      // If not in localStorage, import it once and save it
      const defaultStoryModule = await import('@/data/text.json');
      const migratedStory = this.migrateOldStoryFormat(defaultStoryModule.default);
      
      // Save to localStorage so we don't need to import again
      localStorage.setItem(this.DEFAULT_STORY_KEY, JSON.stringify(migratedStory));
      
      return migratedStory;
    } catch (error) {
      console.error('Failed to load default story:', error);
      return null;
    }
  }

  /**
   * Migrate old story format to new format
   */
  private migrateOldStoryFormat(oldData: any[]): StoryNode[] {
    return oldData.map((oldNode) => {
      const choices = oldNode.options?.map((option: any, choiceIndex: number) => ({
        id: `choice_${oldNode.id}_${choiceIndex}`,
        text: option.text,
        nextNodeId: option.nextText === -1 ? '-1' : option.nextText.toString(),
        conditions: [],
        consequences: [],
      })) || [];

      return {
        id: oldNode.id.toString(),
        title: oldNode.id === 1 ? 'Beginning of the Story' : `Scene ${oldNode.id}`,
        content: oldNode.text,
        choices,
        multimedia: {},
        metadata: {
          tags: oldNode.id === 1 ? ['start'] : [],
          visitCount: 0,
          difficulty: 'medium' as const,
        },
      };
    });
  }

  /**
   * Get all story metadata synchronously (for SSR compatibility)
   */
  private getAllStoryMetadataSync(): StoryListItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const storiesData = localStorage.getItem(this.STORIES_KEY);
      if (!storiesData) return [];

      const stories: Record<string, StoryProject> = JSON.parse(storiesData);
      
      return Object.values(stories).map(project => ({
        id: project.metadata.id,
        title: project.metadata.title,
        description: project.metadata.description,
        author: project.metadata.author,
        difficulty: project.metadata.difficulty,
        tags: project.metadata.tags,
        rating: project.metadata.rating,
        featured: project.metadata.featured || false,
        createdAt: project.metadata.createdAt,
        updatedAt: project.metadata.updatedAt,
        estimatedPlayTime: project.metadata.estimatedPlayTime,
        totalNodes: project.metadata.totalNodes,
        published: project.metadata.published
      }));
    } catch (error) {
      console.error('Failed to load story metadata:', error);
      return [];
    }
  }

  /**
   * Get all story metadata (for client-side use)
   */
  async getAllStoryMetadata(): Promise<StoryListItem[]> {
    await this.ensureInitialized();
    return this.getAllStoryMetadataSync();
  }

  /**
   * Get featured stories
   */
  async getFeaturedStories(): Promise<StoryListItem[]> {
    const stories = await this.getAllStoryMetadata();
    return stories.filter(story => story.featured && story.published);
  }

  /**
   * Get published stories only
   */
  async getPublishedStories(): Promise<StoryListItem[]> {
    const stories = await this.getAllStoryMetadata();
    return stories.filter(story => story.published);
  }

  /**
   * Get story by ID
   */
  async getStory(storyId: string): Promise<StoryProject | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    await this.ensureInitialized();

    try {
      const storiesData = localStorage.getItem(this.STORIES_KEY);
      if (!storiesData) return null;

      const stories: Record<string, StoryProject> = JSON.parse(storiesData);
      return stories[storyId] || null;
    } catch (error) {
      console.error(`Failed to load story ${storyId}:`, error);
      return null;
    }
  }

  /**
   * Save a story project
   */
  async saveStory(project: StoryProject): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot save story on server side');
    }

    try {
      const storiesData = localStorage.getItem(this.STORIES_KEY);
      const stories: Record<string, StoryProject> = storiesData ? JSON.parse(storiesData) : {};

      // Update metadata
      project.metadata.updatedAt = new Date().toISOString();
      project.metadata.totalNodes = project.story.length;

      // Save the project
      stories[project.metadata.id] = project;
      localStorage.setItem(this.STORIES_KEY, JSON.stringify(stories));

      console.log(`✅ Story "${project.metadata.title}" saved successfully`);
    } catch (error) {
      console.error('Failed to save story:', error);
      throw new Error('Failed to save story');
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot delete story on server side');
    }

    try {
      const storiesData = localStorage.getItem(this.STORIES_KEY);
      if (!storiesData) return;

      const stories: Record<string, StoryProject> = JSON.parse(storiesData);
      delete stories[storyId];
      localStorage.setItem(this.STORIES_KEY, JSON.stringify(stories));

      console.log(`🗑️ Story "${storyId}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw new Error('Failed to delete story');
    }
  }

  /**
   * Create a new story project from editor
   */
  async createStoryFromEditor(
    title: string,
    description: string,
    author: string,
    editorNodes: any[],
    editorEdges: any[]
  ): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create story on server side');
    }

    try {
      // Convert editor format to story format
      const storyNodes = this.convertEditorToStory(editorNodes, editorEdges);
      const startNodeId = this.findStartNodeId(storyNodes);

      const storyId = this.generateStoryId(title);
      
      const project: StoryProject = {
        metadata: {
          id: storyId,
          title,
          description,
          author,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedPlayTime: this.estimatePlayTime(storyNodes.length),
          difficulty: this.estimateDifficulty(storyNodes),
          tags: this.extractTags(storyNodes),
          rating: 0,
          totalNodes: storyNodes.length,
          featured: false,
          published: false // Drafts are not published by default
        },
        story: storyNodes,
        startNodeId
      };

      await this.saveStory(project);
      return storyId;
    } catch (error) {
      console.error('Failed to create story from editor:', error);
      throw new Error('Failed to create story');
    }
  }

  /**
   * Publish/unpublish a story
   */
  async toggleStoryPublication(storyId: string): Promise<void> {
    const story = await this.getStory(storyId);
    if (story) {
      story.metadata.published = !story.metadata.published;
      await this.saveStory(story);
    }
  }

  /**
   * Import story from JSON file
   */
  async importStoryFromFile(file: File): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot import story on server side');
    }

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // Check if it's an exported story project or raw story data
      if (data.metadata && data.story) {
        // It's a full project export
        const newId = this.generateStoryId(data.metadata.title);
        data.metadata.id = newId;
        data.metadata.createdAt = new Date().toISOString();
        data.metadata.updatedAt = new Date().toISOString();
        
        await this.saveStory(data);
        return newId;
      } else if (Array.isArray(data)) {
        // It's raw story data, need to create metadata
        const migratedStory = this.migrateOldStoryFormat(data);
        const title = file.name.replace('.json', '');
        
        return await this.createStoryFromRawData(title, migratedStory);
      } else {
        throw new Error('Invalid story format');
      }
    } catch (error) {
      console.error('Failed to import story:', error);
      throw new Error('Failed to import story file');
    }
  }

  /**
   * Export story as JSON file
   */
  async exportStory(storyId: string): Promise<Blob> {
    const story = await this.getStory(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      ...story
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }

  // Helper methods (remaining methods stay the same...)
  private generateStoryId(title: string): string {
    const baseId = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const timestamp = Date.now();
    return `${baseId}-${timestamp}`;
  }

  private convertEditorToStory(nodes: any[], edges: any[]): StoryNode[] {
    // 🔧 FIX: Improved conversion from editor format
    console.log('🔄 Converting editor to story:', { nodes: nodes.length, edges: edges.length });
    
    return nodes.map(node => {
      const storyNode = node.data.storyNode;
      
      // Find all outgoing edges for this node
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      
      // Build choices from edges
      const choices = outgoingEdges.map((edge, index) => {
        let choiceText = `Choice ${index + 1}`;
        let choiceId = edge.id;
        
        // Try to get choice text from various sources
        if (edge.label && typeof edge.label === 'string') {
          choiceText = edge.label;
        } else if (edge.data?.choice?.text) {
          choiceText = edge.data.choice.text;
          choiceId = edge.data.choice.id;
        } else if (storyNode.choices && storyNode.choices[index]) {
          choiceText = storyNode.choices[index].text;
          choiceId = storyNode.choices[index].id;
        }
        
        return {
          id: choiceId,
          text: choiceText,
          nextNodeId: edge.target,
          conditions: [],
          consequences: [],
        };
      });
      
      // If no edges but original choices exist, preserve them
      if (choices.length === 0 && storyNode.choices && storyNode.choices.length > 0) {
        choices.push(...storyNode.choices.map(choice => ({
          ...choice,
          conditions: choice.conditions || [],
          consequences: choice.consequences || [],
        })));
      }
      
      // Add restart for end nodes
      if (node.data.nodeType === 'end') {
        const hasRestart = choices.some(choice => choice.nextNodeId === '-1');
        if (!hasRestart) {
          choices.push({
            id: `restart_${node.id}`,
            text: 'Restart Story',
            nextNodeId: '-1',
            conditions: [],
            consequences: [],
          });
        }
      }
      
      console.log(`✅ Converted node ${node.id}: ${choices.length} choices`);
      
      return {
        id: node.id,
        title: storyNode.title || `Scene ${node.id}`,
        content: storyNode.content || 'No content provided.',
        choices,
        multimedia: storyNode.multimedia || {},
        metadata: storyNode.metadata || {
          tags: node.data.nodeType === 'start' ? ['start'] : 
               node.data.nodeType === 'end' ? ['end'] : [],
          visitCount: 0,
          difficulty: 'medium'
        }
      };
    });
  }

  private findStartNodeId(story: StoryNode[]): string {
    const nodeOne = story.find(node => node.id === '1');
    if (nodeOne) return nodeOne.id;

    const taggedStart = story.find(node => 
      node.metadata.tags.includes('start')
    );
    if (taggedStart) return taggedStart.id;

    return story[0]?.id || '';
  }

  private estimatePlayTime(nodeCount: number): string {
    const minutes = Math.max(5, Math.round(nodeCount * 1.2));
    const max = Math.round(minutes * 1.5);
    return `${minutes}-${max} min`;
  }

  private estimateDifficulty(story: StoryNode[]): 'Easy' | 'Medium' | 'Hard' {
    const avgChoices = story.reduce((sum, node) => sum + node.choices.length, 0) / story.length;
    
    if (avgChoices <= 2 && story.length <= 15) return 'Easy';
    if (avgChoices <= 3 && story.length <= 25) return 'Medium';
    return 'Hard';
  }

  private extractTags(story: StoryNode[]): string[] {
    const allTags = story.flatMap(node => node.metadata.tags);
    return [...new Set(allTags)];
  }

  private async createStoryFromRawData(title: string, story: StoryNode[]): Promise<string> {
    const storyId = this.generateStoryId(title);
    
    const project: StoryProject = {
      metadata: {
        id: storyId,
        title,
        description: 'Imported story',
        author: 'Unknown',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedPlayTime: this.estimatePlayTime(story.length),
        difficulty: this.estimateDifficulty(story),
        tags: this.extractTags(story),
        rating: 0,
        totalNodes: story.length,
        featured: false,
        published: true
      },
      story,
      startNodeId: this.findStartNodeId(story)
    };

    await this.saveStory(project);
    return storyId;
  }
}

// Export singleton instance
export const dynamicStoryManager = DynamicStoryManager.getInstance();