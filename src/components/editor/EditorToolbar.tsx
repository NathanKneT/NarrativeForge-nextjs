// src/components/editor/EditorToolbar.tsx
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
  Sparkles,
  Zap,
} from 'lucide-react';
import { StoryProject } from '@/types/editor';
import { dynamicStoryManager } from '@/lib/dynamicStoryManager';
import { ProfessionalButton } from '@/components/ui/PanelButton';
import { EnhancedAutoSave } from '@/components/ui/AutoSave';
import { ProfessionalTooltip } from '@/components/ui/PanelTooltip';

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
  onAIGenerate: () => void;
  onBulkGenerate: () => void;
  currentProject: StoryProject | null;
  nodes: any[];
  edges: any[];
  hasSelectedNode: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCreateNode,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onExportProject,
  onAutoArrange,
  onTestStory,
  onAIGenerate,
  onBulkGenerate,
  currentProject,
  nodes,
  edges,
  hasSelectedNode,
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Validation for testing
  const validateStoryForTest = () => {
    const errors: string[] = [];

    const startNodes = nodes.filter((node) => node.data?.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('At least one start node is required');
    }
    if (startNodes.length > 1) {
      errors.push('Only one start node is allowed');
    }

    const endNodes = nodes.filter((node) => node.data?.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('At least one end node is required');
    }

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
      const storyId = await dynamicStoryManager.createStoryFromEditor(
        currentProject.name,
        currentProject.description,
        currentProject.metadata.author || 'Unknown Author',
        nodes,
        edges
      );

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
      onSaveProject();
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
            <ProfessionalButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={onNewProject}
              title="Create new project"
            >
              New
            </ProfessionalButton>

            <ProfessionalButton
              variant="success"
              size="md"
              icon={Save}
              onClick={onSaveProject}
              title="Save current project"
            >
              Save
            </ProfessionalButton>

            <ProfessionalButton
              variant="secondary"
              size="md"
              icon={FolderOpen}
              onClick={onLoadProject}
              title="Load existing project"
            >
              Load
            </ProfessionalButton>
          </div>
        </div>

        {/* Center Section - Node Creation + AI Generation */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <ProfessionalButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setShowNodeMenu(!showNodeMenu)}
            >
              Add Node
            </ProfessionalButton>

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

          {/* AI Generation Button */}
          <ProfessionalTooltip 
            content={hasSelectedNode ? 'Generate AI content for selected node' : 'Select a node first to generate AI content'}
          >
            <ProfessionalButton
              variant={hasSelectedNode ? "success" : "secondary"}
              size="md"
              icon={Sparkles}
              onClick={onAIGenerate}
              disabled={!hasSelectedNode}
            >
              Generate with AI
            </ProfessionalButton>
          </ProfessionalTooltip>

          {/* Bulk Generation Button */}
          <ProfessionalTooltip content="Generate complete story with 8-30 nodes using AI">
            <ProfessionalButton
              variant="primary"
              size="md"
              icon={Zap}
              onClick={onBulkGenerate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Bulk Generate
            </ProfessionalButton>
          </ProfessionalTooltip>

          <ProfessionalButton
            variant="secondary"
            size="md"
            icon={Shuffle}
            onClick={onAutoArrange}
            title="Auto-arrange nodes"
          >
            Arrange
          </ProfessionalButton>
        </div>

        {/* Right Section - Export & Tools */}
        <div className="flex items-center gap-2">
          {/* Publish Menu */}
          <div className="relative">
            <ProfessionalButton
              variant="success"
              size="md"
              icon={Eye}
              loading={isPublishing}
              onClick={() => setShowPublishMenu(!showPublishMenu)}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </ProfessionalButton>

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
            <ProfessionalButton
              variant="secondary"
              size="md"
              icon={Download}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
            </ProfessionalButton>

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

          <ProfessionalButton
            variant="success"
            size="md"
            icon={Play}
            onClick={handleTestStory}
            title="Test the story"
          >
            Test
          </ProfessionalButton>

          <ProfessionalButton
            variant="secondary"
            size="md"
            icon={Settings}
            title="Settings"
          >
            Settings
          </ProfessionalButton>
        </div>
      </div>

      {/* Quick Stats with Auto-Save */}
      {currentProject && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Created: {currentProject.metadata.createdAt.toLocaleDateString()}</span>
            <span>Modified: {currentProject.metadata.updatedAt.toLocaleDateString()}</span>
            <span>Version: {currentProject.metadata.version}</span>
            <span>Nodes: {nodes.length}</span>
            <span>Connections: {edges.length}</span>
            {hasSelectedNode && (
              <span className="text-green-400">• Node selected for AI generation</span>
            )}
          </div>
          
          {/* Auto-save indicator */}
          <EnhancedAutoSave
            data={{ nodes, edges, currentProject }}
            projectName={currentProject.name}
            onSave={async (data) => {
              const serializedProject = {
                ...data.currentProject,
                nodes: data.nodes,
                edges: data.edges,
                metadata: {
                  ...data.currentProject.metadata,
                  updatedAt: new Date().toISOString(),
                },
              };
              localStorage.setItem(data.currentProject.id, JSON.stringify(serializedProject));
            }}
            showDetailedStatus={process.env.NODE_ENV === 'development'}
          />
        </div>
      )}
    </div>
  );
};