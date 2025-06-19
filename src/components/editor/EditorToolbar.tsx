'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Save,
  FolderOpen,
  Download,
  Play,
  Settings,
  FileText,
  Circle,
  Square,
  Shuffle,
  Home,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StoryProject } from '@/types/editor';
import { dynamicStoryManager } from '@/lib/dynamicStoryManager';

interface EditorToolbarProps {
  onCreateNode: (
    type: 'start' | 'story' | 'end',
    position?: { x: number; y: number }
  ) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject?: () => void;
  onExportProject?: (format: string) => void;
  onAutoArrange: () => void;
  onTestStory: () => void;
  currentProject: StoryProject | null;
  nodes: any[];
  edges: any[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCreateNode,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onExportProject,
  onAutoArrange,
  onTestStory,
  currentProject,
  nodes,
  edges,
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Validation for testing
  const validateStoryForTest = () => {
    const errors: string[] = [];

    // Check for at least one start node
    const startNodes = nodes.filter((node) => node.data?.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('At least one start node is required');
    }
    if (startNodes.length > 1) {
      errors.push('Only one start node is allowed');
    }

    // Check for at least one end node
    const endNodes = nodes.filter((node) => node.data?.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('At least one end node is required');
    }

    // Check that all nodes (except end) have outgoing connections
    nodes.forEach((node) => {
      if (node.data?.nodeType !== 'end') {
        const hasOutgoingConnection = edges.some(
          (edge) => edge.source === node.id
        );
        if (!hasOutgoingConnection) {
          errors.push(
            `Node "${node.data?.storyNode?.title || node.id}" has no outgoing connections`
          );
        }
      }
    });

    // Check that all nodes (except start) have incoming connections
    nodes.forEach((node) => {
      if (node.data?.nodeType !== 'start') {
        const hasIncomingConnection = edges.some(
          (edge) => edge.target === node.id
        );
        if (!hasIncomingConnection) {
          errors.push(
            `Node "${node.data?.storyNode?.title || node.id}" is not accessible`
          );
        }
      }
    });

    return errors;
  };

  const handleTestStory = () => {
    const errors = validateStoryForTest();

    if (errors.length > 0) {
      const errorMessage =
        "Cannot test the story:\n\n" + errors.join('\n');
      alert(errorMessage);
      return;
    }

    // If no errors, launch the test
    onTestStory();
  };

  const handlePublishStory = async () => {
    if (!currentProject || nodes.length === 0) {
      alert('❌ No project to publish! Create and save a story first.');
      return;
    }

    const errors = validateStoryForTest();
    if (errors.length > 0) {
      const shouldContinue = confirm(
        "Story has validation issues:\n\n" + 
        errors.join('\n') + 
        "\n\nPublish anyway? Players may encounter issues."
      );
      if (!shouldContinue) return;
    }

    setIsPublishing(true);
    try {
      // Create story from current editor state
      const storyId = await dynamicStoryManager.createStoryFromEditor(
        currentProject.name,
        currentProject.description,
        currentProject.metadata.author || 'Unknown Author',
        nodes,
        edges
      );

      // Publish the story
      await dynamicStoryManager.toggleStoryPublication(storyId);

      alert(`✅ Story "${currentProject.name}" published successfully!\nStory ID: ${storyId}`);
      setShowPublishMenu(false);
    } catch (error) {
      console.error('Publish failed:', error);
      alert('❌ Failed to publish story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAndPublish = async () => {
    try {
      // First save the project
      onSaveProject();
      
      // Then publish
      await handlePublishStory();
    } catch (error) {
      console.error('Save and publish failed:', error);
      alert('❌ Failed to save and publish story.');
    }
  };

  const nodeTypes = [
    {
      type: 'start' as const,
      label: 'Start',
      icon: Circle,
      color: 'text-green-400',
    },
    {
      type: 'story' as const,
      label: 'Scene',
      icon: FileText,
      color: 'text-blue-400',
    },
    { 
      type: 'end' as const, 
      label: 'End', 
      icon: Square, 
      color: 'text-red-400' 
    },
  ];

  const exportFormats = [
    {
      format: 'asylum-json',
      label: 'Asylum JSON',
      description: 'Compatible with the game platform',
    },
    { 
      format: 'json', 
      label: 'Standard JSON', 
      description: 'Generic format' 
    },
    { 
      format: 'twine', 
      label: 'Twine', 
      description: 'Twine compatible format' 
    },
  ];

  const handleCreateNode = (type: 'start' | 'story' | 'end') => {
    // Create node at center of view
    onCreateNode(type, {
      x: Math.random() * 300 + 200,
      y: Math.random() * 200 + 100,
    });
    setShowNodeMenu(false);
  };

  const handleExport = (format: string) => {
    onExportProject?.(format);
    setShowExportMenu(false);
  };

  return (
    <div className="border-b border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Navigation + Project Actions */}
        <div className="flex items-center gap-4">
          {/* Navigation Home */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
            title="Back to Stories"
          >
            <Home size={16} />
            Stories
          </Link>

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Story Editor</h1>
            {currentProject && (
              <span className="text-sm text-gray-400">
                - {currentProject.name}
              </span>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700"
              title="New project"
            >
              <Plus size={16} />
              New
            </button>

            <button
              onClick={onSaveProject}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
              title="Save"
            >
              <Save size={16} />
              Save
            </button>

            <button
              onClick={onLoadProject}
              className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
              title="Load"
            >
              <FolderOpen size={16} />
              Load
            </button>
          </div>
        </div>

        {/* Center Section - Node Creation */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              <Plus size={16} />
              Add Node
            </button>

            {showNodeMenu && (
              <div className="absolute left-0 top-full z-10 mt-2 min-w-[200px] rounded-lg bg-gray-700 p-2 shadow-xl">
                {nodeTypes.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => handleCreateNode(type)}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-white transition-colors hover:bg-gray-600"
                  >
                    <Icon size={18} className={color} />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-400">
                        {type === 'start' && 'Story beginning'}
                        {type === 'story' && 'Narrative scene with choices'}
                        {type === 'end' && 'Story conclusion'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onAutoArrange}
            className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
            title="Auto-arrange"
          >
            <Shuffle size={16} />
            Arrange
          </button>
        </div>

        {/* Right Section - Export & Tools */}
        <div className="flex items-center gap-2">
          {/* Publish Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPublishMenu(!showPublishMenu)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
              disabled={isPublishing}
            >
              <Eye size={16} />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>

            {showPublishMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 min-w-[250px] rounded-lg bg-gray-700 p-2 shadow-xl">
                <button
                  onClick={handlePublishStory}
                  disabled={isPublishing}
                  className="flex w-full flex-col items-start rounded px-3 py-2 text-left text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
                >
                  <div className="font-medium">Publish Story</div>
                  <div className="text-xs text-gray-400">Make available to players</div>
                </button>
                <button
                  onClick={handleSaveAndPublish}
                  disabled={isPublishing}
                  className="flex w-full flex-col items-start rounded px-3 py-2 text-left text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
                >
                  <div className="font-medium">Save & Publish</div>
                  <div className="text-xs text-gray-400">Save project then publish</div>
                </button>
              </div>
            )}
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-white transition-colors hover:bg-orange-700"
            >
              <Download size={16} />
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 min-w-[250px] rounded-lg bg-gray-700 p-2 shadow-xl">
                {exportFormats.map(({ format, label, description }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="flex w-full flex-col items-start rounded px-3 py-2 text-left text-white transition-colors hover:bg-gray-600"
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-400">{description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <button
            onClick={handleTestStory}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
            title="Test the story"
          >
            <Play size={16} />
            Test
          </button>

          <button
            className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {currentProject && (
        <div className="mt-3 flex items-center gap-6 text-sm text-gray-400">
          <span>
            Created: {currentProject.metadata.createdAt.toLocaleDateString()}
          </span>
          <span>
            Modified: {currentProject.metadata.updatedAt.toLocaleDateString()}
          </span>
          <span>Version: {currentProject.metadata.version}</span>
          <span>Nodes: {nodes.length}</span>
          <span>Connections: {edges.length}</span>
        </div>
      )}
    </div>
  );
};