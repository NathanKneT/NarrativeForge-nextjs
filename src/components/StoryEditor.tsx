'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Node,
  Connection,
  ConnectionLineType,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import {
  LazyReactFlowEditor as ReactFlow,
  Controls,
  MiniMap,
  Background,
  Panel,
  ReactFlowProvider,
} from '@/components/LazyReactFlow';
import '@xyflow/react/dist/style.css';

import { EditorNode, EditorEdge, StoryProject } from '@/types/editor';
import { Choice, StoryNode } from '@/types/story';
import { EditorToolbar } from './editor/EditorToolbar';
import { NodeEditor } from './editor/NodeEditor';
import { StoryNodeComponent } from './editor/StoryNodeComponent';
import { StartNodeComponent } from './editor/StartNodeComponent';
import { EndNodeComponent } from './editor/EndNodeComponent';
import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';
import { ProjectInitModal } from './editor/ProjectInitModal';
import { SaveNotification, useNotification } from './editor/SaveNotification';
import { LoadProjectModal } from './editor/LoadProjectModal';
import { AIGenerationModal } from './editor/AIGenerationModal';
import { BulkStoryGeneratorModal } from './editor/BulkStoryGeneratorModal';
import { dynamicStoryManager } from '@/lib/dynamicStoryManager';

// Custom node types with strict types compatible with React Flow v12
const nodeTypes = {
  storyNode: StoryNodeComponent,
  startNode: StartNodeComponent,
  endNode: EndNodeComponent,
} as const;

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#e94560', strokeWidth: 2 },
};

export interface StoryEditorRef {
  getNodes: () => EditorNode[];
  getEdges: () => EditorEdge[];
  getCurrentProject: () => StoryProject | null;
  updateProject: (project: StoryProject) => void;
}

interface StoryEditorProps {
  onSave?: (project: StoryProject) => void;
  onLoad?: () => void;
  onExport?: (format: string) => void;
  onDataUpdate?: (
    nodes: EditorNode[],
    edges: EditorEdge[],
    project: StoryProject | null
  ) => void;
}

// Interface for choice modal with strict types
interface ChoiceModalProps {
  isOpen: boolean;
  targetNodeTitle: string;
  onConfirm: (choiceText: string) => void;
  onCancel: () => void;
}

// Modal Component for choice input - Strict types
const ChoiceModal: React.FC<ChoiceModalProps> = ({
  isOpen,
  targetNodeTitle,
  onConfirm,
  onCancel,
}) => {
  const [choiceText, setChoiceText] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = (): void => {
    if (!choiceText.trim()) {
      alert('❌ Choice text is required!');
      return;
    }
    onConfirm(choiceText.trim());
    setChoiceText('');
  };

  const handleCancel = (): void => {
    setChoiceText('');
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-96 rounded-lg bg-gray-800 p-6">
        <h3 className="mb-4 text-lg font-bold text-white">New Choice</h3>
        <p className="mb-4 text-gray-300">
          What is the choice text to go to &quot;{targetNodeTitle}&quot;?
        </p>
        <input
          type="text"
          value={choiceText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setChoiceText(e.target.value)
          }
          placeholder="Ex: Go right"
          className="mb-4 w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="rounded bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            type="button"
          >
            Create Choice
          </button>
        </div>
      </div>
    </div>
  );
};

const StoryEditorContent = forwardRef<StoryEditorRef, StoryEditorProps>(
  ({ onSave, onLoad, onExport, onDataUpdate }, ref) => {
    // Correct usage of React Flow hooks with strict types
    const [nodes, setNodes] = useNodesState<EditorNode>([]);
    const [edges, setEdges] = useEdgesState<EditorEdge>([]);

    const { notification, showNotification, hideNotification } =
      useNotification();
    const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
    const [selectedNode, setSelectedNode] = useState<EditorNode | null>(null);
    const [isNodeEditorOpen, setIsNodeEditorOpen] = useState<boolean>(false);
    const [currentProject, setCurrentProject] = useState<StoryProject | null>(
      null
    );
    const [showInitModal, setShowInitModal] = useState<boolean>(true);
    const [isProjectInitialized, setIsProjectInitialized] =
      useState<boolean>(false);

    // AI Generation state
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
    const [isBulkGeneratorOpen, setIsBulkGeneratorOpen] = useState<boolean>(false);

    // State for choice modal with strict types
    const [choiceModal, setChoiceModal] = useState<{
      isOpen: boolean;
      targetNodeTitle: string;
      connectionParams: Connection | null;
    }>({
      isOpen: false,
      targetNodeTitle: '',
      connectionParams: null,
    });

    const editorDataRef = React.useRef<{
      nodes: EditorNode[];
      edges: EditorEdge[];
      project: StoryProject | null;
    }>({
      nodes: [],
      edges: [],
      project: null,
    });

    // Add validation function for story testing
    const validateStoryForTest = useCallback(() => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for at least one start node
      const startNodes = nodes.filter((node) => node.data?.nodeType === 'start');
      if (startNodes.length === 0) {
        errors.push('❌ At least one start node is required');
      }
      if (startNodes.length > 1) {
        errors.push('❌ Only one start node is allowed');
      }

      // Check for at least one end node
      const endNodes = nodes.filter((node) => node.data?.nodeType === 'end');
      if (endNodes.length === 0) {
        warnings.push('⚠️ No end nodes found - players may get stuck');
      }

      // Check that all nodes (except end) have outgoing connections
      nodes.forEach((node) => {
        if (node.data?.nodeType !== 'end') {
          const hasOutgoingConnection = edges.some(
            (edge) => edge.source === node.id
          );
          if (!hasOutgoingConnection && !node.data?.isEndNode) {
            warnings.push(
              `⚠️ Node "${node.data?.storyNode?.title || node.id}" has no outgoing connections`
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
            warnings.push(
              `⚠️ Node "${node.data?.storyNode?.title || node.id}" is not accessible from start`
            );
          }
        }
      });

      return { errors, warnings };
    }, [nodes, edges]);

    // Get selected node information for AI generation
    const selectedNodeForAI = useMemo(() => {
      if (!selectedNodeId) return null;
      return nodes.find(node => node.id === selectedNodeId) || null;
    }, [selectedNodeId, nodes]);

    // Expose data via ref with strict types
    useImperativeHandle(
      ref,
      () => ({
        getNodes: (): EditorNode[] => nodes,
        getEdges: (): EditorEdge[] => edges,
        getCurrentProject: (): StoryProject | null => currentProject,
        updateProject: (project: StoryProject): void => {
          setCurrentProject(project);
          editorDataRef.current.project = project;
        },
      }),
      [nodes, edges, currentProject]
    );

    // Auto-save to localStorage with typed error handling
    const autoSave = useCallback((): void => {
      if (nodes.length > 0) {
        const autoSaveProject: StoryProject = {
          id: 'auto-save',
          name: 'Auto Save Project',
          description: 'This is an auto-saved project',
          nodes,
          edges,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
          },
        };

        try {
          const serializedProject = {
            ...autoSaveProject,
            metadata: {
              ...autoSaveProject.metadata,
              createdAt: autoSaveProject.metadata.createdAt.toISOString(),
              updatedAt: autoSaveProject.metadata.updatedAt.toISOString(),
            },
          };

          localStorage.setItem(
            'asylum-editor-autosave',
            JSON.stringify(serializedProject)
          );
          if (process.env.NODE_ENV === 'development') {
            console.log('💾 Auto-save completed');
          }
        } catch (error: unknown) {
          console.warn('❌ Auto-save error:', error);
        }
      }
    }, [nodes, edges]);

    React.useEffect(() => {
      // Small delay to let React Flow update
      const timeoutId = setTimeout(() => {
        // Trigger edge re-render by "touching" them
        setEdges((currentEdges) => [...currentEdges]);
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [nodes, setEdges]);

    // Check for auto-saved project at startup
    React.useEffect(() => {
      const checkExistingProject = () => {
        try {
          const savedProject = localStorage.getItem('asylum-editor-autosave');
          if (savedProject) {
            const parsed = JSON.parse(savedProject);
            if (parsed.nodes && parsed.nodes.length > 0) {
              // Existing project found, don't show modal and load it directly
              const restoredProject: StoryProject = {
                ...parsed,
                metadata: {
                  ...parsed.metadata,
                  createdAt: new Date(parsed.metadata.createdAt),
                  updatedAt: new Date(parsed.metadata.updatedAt),
                },
              };

              setCurrentProject(restoredProject);
              setNodes(parsed.nodes || []);
              setEdges(parsed.edges || []);
              setShowInitModal(false);
              setIsProjectInitialized(true);

              console.log(
                '📂 Auto-saved project restored:',
                restoredProject.name
              );
              return;
            }
          }
        } catch (error) {
          console.warn(
            '⚠️ Error checking existing project:',
            error
          );
          localStorage.removeItem('asylum-editor-autosave');
        }
      };

      checkExistingProject();
    }, [setNodes, setEdges]);

    // Auto-save every 30 seconds
    React.useEffect(() => {
      const interval = setInterval(autoSave, 30000);
      return () => clearInterval(interval);
    }, [autoSave]);

    // Notify changes for export with strict types
    React.useEffect(() => {
      if (onDataUpdate) {
        onDataUpdate(nodes, edges, currentProject);
      }

      // Update reference for export
      editorDataRef.current = { nodes, edges, project: currentProject };
    }, [nodes, edges, currentProject, onDataUpdate]);

    // Memoization for performance optimization
    const memoizedNodes = useMemo(() => nodes, [nodes]);
    const memoizedEdges = useMemo(() => edges, [edges]);

    // Connection handler with modal - Strict types
    const onConnect: OnConnect = useCallback(
      (params: Connection) => {
        console.log('🔍 onConnect called with params:', {
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        });

        // Strict parameter validation with type guards
        if (
          !params.source ||
          !params.target ||
          typeof params.source !== 'string' ||
          typeof params.target !== 'string'
        ) {
          console.warn(
            '❌ Invalid connection: missing or invalid source or target'
          );
          return;
        }

        const sourceNode = nodes.find((node) => node.id === params.source);
        const targetNode = nodes.find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) {
          console.warn('❌ Source or target nodes not found');
          return;
        }

        console.log('🔍 Connection details:', {
          sourceNode: {
            id: sourceNode.id,
            type: sourceNode.data.nodeType,
            title: sourceNode.data.storyNode.title,
            choices: sourceNode.data.storyNode.choices.length,
          },
          targetNode: {
            id: targetNode.id,
            type: targetNode.data.nodeType,
            title: targetNode.data.storyNode.title,
          },
          sourceHandle: params.sourceHandle,
        });

        // Prevent self-connections
        if (params.source === params.target) {
          console.warn('❌ Self-connection forbidden');
          return;
        }

        // Check that source node is not an end node
        if (sourceNode.data.nodeType === 'end') {
          alert('❌ Cannot create connection from an end node!');
          return;
        }

        // Check that there isn't already a connection between these nodes
        const existingConnection = edges.find(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );
        if (existingConnection) {
          alert('❌ A connection already exists between these nodes!');
          return;
        }

        console.log('✅ Opening choice modal for connection');

        // Open modal to enter choice
        setChoiceModal({
          isOpen: true,
          targetNodeTitle: targetNode.data.storyNode.title,
          connectionParams: params,
        });
      },
      [nodes, edges]
    );

    // Function to confirm choice from modal with strict types
    const handleChoiceConfirm = useCallback(
      (choiceText: string): void => {
        const params = choiceModal.connectionParams;
        if (!params || !params.source || !params.target) return;

        // Handle ALL types of sourceHandle
        const sourceHandle = params.sourceHandle;
        const isDefaultHandle = sourceHandle?.includes('-default-source');

        console.log('🔍 Connection analysis:', {
          sourceHandle: sourceHandle,
          isDefaultHandle: isDefaultHandle,
          source: params.source,
          target: params.target,
        });

        // If it's a default handle, replace it with a specific choice
        if (isDefaultHandle) {
          // Use the default handle ID as sourceHandle
          const newEdge: EditorEdge = {
            id: `edge-${params.source}-${params.target}-${Date.now()}`,
            source: params.source,
            target: params.target,
            sourceHandle: sourceHandle, // Keep existing default handle
            targetHandle: params.targetHandle,
            type: 'smoothstep',
            data: {
              choice: {
                id: `choice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: choiceText,
                nextNodeId: params.target,
                conditions: [],
                consequences: [],
              },
            },
            label: choiceText,
            labelStyle: { fill: '#ffffff', fontWeight: 600 },
            labelBgStyle: { fill: '#e94560', fillOpacity: 0.8 },
          };

          console.log('🔍 Creating edge for default handle:', {
            edgeId: newEdge.id,
            sourceHandle: sourceHandle,
            label: choiceText,
          });

          // Add the edge
          setEdges((eds) => addEdge(newEdge, eds));

          // Update source node - ADD choice without changing existing handles
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === params.source) {
                const newChoice: Choice = {
                  id: sourceHandle ?? `choice-${Date.now()}`, // Handle null with fallback
                  text: choiceText,
                  nextNodeId: params.target,
                  conditions: [],
                  consequences: [],
                };

                return {
                  ...node,
                  data: {
                    ...node.data,
                    storyNode: {
                      ...node.data.storyNode,
                      choices: [...node.data.storyNode.choices, newChoice],
                    },
                  },
                } as EditorNode; // Explicit cast to ensure type
              }
              return node;
            })
          );

          console.log('✅ Connection created with default handle:', {
            choiceText,
            sourceHandle: sourceHandle,
            type: 'default-handle',
          });
        } else {
          // Specific handle - normal logic
          const uniqueChoiceId = `choice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newEdge: EditorEdge = {
            id: `edge-${params.source}-${params.target}-${Date.now()}`,
            source: params.source,
            target: params.target,
            sourceHandle: uniqueChoiceId,
            targetHandle: params.targetHandle,
            type: 'smoothstep',
            data: {
              choice: {
                id: uniqueChoiceId,
                text: choiceText,
                nextNodeId: params.target,
                conditions: [],
                consequences: [],
              },
            },
            label: choiceText,
            labelStyle: { fill: '#ffffff', fontWeight: 600 },
            labelBgStyle: { fill: '#e94560', fillOpacity: 0.8 },
          };

          console.log('🔍 Creating edge for specific handle:', {
            edgeId: newEdge.id,
            sourceHandle: uniqueChoiceId,
            label: choiceText,
          });

          setEdges((eds) => addEdge(newEdge, eds));

          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === params.source) {
                const newChoice = {
                  id: uniqueChoiceId,
                  text: choiceText,
                  nextNodeId: params.target,
                  conditions: [],
                  consequences: [],
                };

                return {
                  ...node,
                  data: {
                    ...node.data,
                    storyNode: {
                      ...node.data.storyNode,
                      choices: [...node.data.storyNode.choices, newChoice],
                    },
                  },
                };
              }
              return node;
            })
          );

          console.log('✅ Connection created with specific handle:', {
            choiceText,
            choiceId: uniqueChoiceId,
            type: 'specific-handle',
          });
        }

        // Forced re-render with longer delay
        setTimeout(() => {
          setEdges((currentEdges) => {
            console.log('🔄 Force re-render edges:', currentEdges.length);
            return [...currentEdges];
          });
          setNodes((currentNodes) => {
            console.log('🔄 Force re-render nodes:', currentNodes.length);
            return [...currentNodes];
          });
        }, 150); // Longer delay for React Flow

        // Close modal
        setChoiceModal({
          isOpen: false,
          targetNodeTitle: '',
          connectionParams: null,
        });
      },
      [choiceModal, setEdges, setNodes]
    );

    // Function to cancel modal
    const handleChoiceCancel = useCallback((): void => {
      setChoiceModal({
        isOpen: false,
        targetNodeTitle: '',
        connectionParams: null,
      });
    }, []);

    // Create new node with validation - Strict types
    const createNode = useCallback(
      (
        type: 'start' | 'story' | 'end',
        position = { x: 0, y: 0 }
      ): EditorNode | null => {
        // Check that there's only one start node
        if (!isProjectInitialized) {
          alert("❌ Please create or load a project first!");
          setShowInitModal(true);
          return null;
        }
        if (type === 'start') {
          const existingStartNodes = nodes.filter(
            (node) => node.data.nodeType === 'start'
          );
          if (existingStartNodes.length > 0) {
            alert(
              "There can only be one start node. Delete the existing one first."
            );
            return null;
          }
        }

        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const baseStoryNode: StoryNode = {
          id: nodeId,
          title:
            type === 'start'
              ? "Story Beginning"
              : type === 'end'
                ? "Story End"
                : 'New Scene',
          content:
            type === 'start'
              ? 'The beginning of your story...'
              : type === 'end'
                ? "The end of the story."
                : 'Scene content...',
          choices: [],
          multimedia: {},
          metadata: {
            tags: [],
            visitCount: 0,
            difficulty: 'medium',
          },
        };

        const newNode: EditorNode = {
          id: nodeId,
          type:
            type === 'start'
              ? 'startNode'
              : type === 'end'
                ? 'endNode'
                : 'storyNode',
          position,
          data: {
            storyNode: baseStoryNode,
            nodeType: type,
            isStartNode: type === 'start',
            isEndNode: type === 'end',
          },
          dragHandle: '.drag-handle',
        };

        console.log('🔍 Creating node:', {
          type: type,
          reactFlowType: newNode.type,
          nodeType: newNode.data.nodeType,
          isEndNode: newNode.data.isEndNode,
        });

        setNodes((nds) => [...nds, newNode]);
        return newNode;
      },
      [setNodes, nodes, isProjectInitialized]
    );

    // Enhanced project creation with better naming
    const handleCreateNewProject = useCallback(
      (projectName: string, description: string) => {
        // Clean and validate project name
        const cleanName = projectName
          .trim()
          .replace(/[^a-zA-Z0-9\s\-_]/g, '')
          .substring(0, 50);

        if (!cleanName) {
          showNotification('Invalid project name!', 'error');
          return;
        }

        const newProject: StoryProject = {
          id: `asylum-project-${cleanName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: cleanName,
          description: description.trim().substring(0, 200),
          nodes: [],
          edges: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
            author: 'User',
            aiGenerated: false,
          },
        };

        setCurrentProject(newProject);
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setSelectedNodeId(null);
        setIsNodeEditorOpen(false);
        setShowInitModal(false);
        setIsProjectInitialized(true);

        console.log('✅ New project created:', {
          name: cleanName,
          id: newProject.id
        });

        showNotification(`📝 Project "${cleanName}" created!`, 'success');

        // Auto-save new project
        setTimeout(() => {
          try {
            const serializedProject = {
              ...newProject,
              metadata: {
                ...newProject.metadata,
                createdAt: newProject.metadata.createdAt.toISOString(),
                updatedAt: newProject.metadata.updatedAt.toISOString(),
              },
            };
            localStorage.setItem(newProject.id, JSON.stringify(serializedProject));
            console.log('💾 New project auto-saved');
          } catch (error) {
            console.warn('⚠️ New project auto-save error:', error);
          }
        }, 1000);
      },
      [setNodes, setEdges, showNotification]
    );

    const handleLoadExistingProject = useCallback(() => {
      setShowInitModal(false);
      setShowLoadModal(true);
    }, []);

    const handleToolbarLoadProject = useCallback(() => {
      setShowLoadModal(true);
    }, []);

    // Delete node with edge and choice cleanup - Strict types
    const deleteNode = useCallback(
      (nodeId: string): void => {
        // Check if it's the last start node
        const nodeToDelete = nodes.find((n) => n.id === nodeId);
        if (nodeToDelete?.data.nodeType === 'start') {
          const startNodes = nodes.filter((n) => n.data.nodeType === 'start');
          if (startNodes.length === 1) {
            const confirm = window.confirm(
              "⚠️ You're deleting the last start node. Your story will no longer have an entry point. Continue?"
            );
            if (!confirm) return;
          }
        }

        // Delete the node
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));

        // Delete connected edges
        const edgesToRemove = edges.filter(
          (edge) => edge.source === nodeId || edge.target === nodeId
        );
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );

        // Update choices of source nodes
        edgesToRemove.forEach((edge) => {
          if (edge.source !== nodeId) {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === edge.source) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      storyNode: {
                        ...node.data.storyNode,
                        choices: node.data.storyNode.choices.filter(
                          (choice) => choice.nextNodeId !== nodeId
                        ),
                      },
                    },
                  };
                }
                return node;
              })
            );
          }
        });

        // Clear AI selection if deleted node was selected
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }

        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
          setIsNodeEditorOpen(false);
        }
      },
      [setNodes, setEdges, selectedNode, selectedNodeId, edges, nodes]
    );

    // Duplicate node - Strict types
    const duplicateNode = useCallback(
      (node: EditorNode): EditorNode => {
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Don't duplicate start nodes
        if (node.data.nodeType === 'start') {
          alert('❌ Cannot duplicate start node!');
          return node;
        }

        const newNode: EditorNode = {
          ...node,
          id: nodeId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: {
            ...node.data,
            storyNode: {
              ...node.data.storyNode,
              id: nodeId,
              title: `${node.data.storyNode.title} (copy)`,
              choices: [], // Reset choices to avoid conflicts
            },
          },
        };

        setNodes((nds) => [...nds, newNode]);
        return newNode;
      },
      [setNodes]
    );

    // Optimized event handlers with strict types compatible with React Flow v12
    const onNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node): void => {
        // Safe type assertion for EditorNode
        const editorNode = node as EditorNode;
        setSelectedNode(editorNode);
        setSelectedNodeId(editorNode.id); // Track node selection for AI
      },
      []
    );

    const onNodeDoubleClick = useCallback(
      (_event: React.MouseEvent, node: Node): void => {
        // Safe type assertion for EditorNode
        const editorNode = node as EditorNode;
        setSelectedNode(editorNode);
        setSelectedNodeId(editorNode.id); // Track node selection for AI
        setIsNodeEditorOpen(true);
      },
      []
    );

    // Handle pane click to deselect nodes
    const onPaneClick = useCallback(() => {
      setSelectedNodeId(null);
    }, []);

    // Change handlers with strict types - FIXED for React Flow v12
    const handleNodesChange: OnNodesChange = useCallback(
      (changes: NodeChange[]) => {
        setNodes(
          (nds) => applyNodeChanges(changes, nds as Node[]) as EditorNode[]
        );
      },
      [setNodes]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        setEdges(
          (eds) => applyEdgeChanges(changes, eds as any[]) as EditorEdge[]
        );
      },
      [setEdges]
    );

    // Save edited node with edge updates - Strict types
    const saveNodeEdit = useCallback(
      (updatedStoryNode: StoryNode): void => {
        if (!selectedNode) return;

        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    storyNode: updatedStoryNode,
                  },
                }
              : node
          )
        );

        // Update labels of corresponding edges
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === selectedNode.id) {
              const choice = updatedStoryNode.choices.find(
                (c) => c.id === edge.sourceHandle
              );
              if (choice) {
                return {
                  ...edge,
                  label: choice.text,
                  data: {
                    ...edge.data,
                    choice: choice,
                  },
                };
              }
            }
            return edge;
          })
        );

        setIsNodeEditorOpen(false);
      },
      [selectedNode, setNodes, setEdges]
    );

    // AI Generation handlers
    const handleAIGenerate = useCallback(() => {
      if (!selectedNodeId) {
        showNotification('Please select a node first', 'error');
        return;
      }
      setIsAIModalOpen(true);
    }, [selectedNodeId, showNotification]);

    const handleBulkGenerate = useCallback(() => {
      setIsBulkGeneratorOpen(true);
    }, []);

    // Enhanced bulk story application with better positioning
    const handleApplyBulkStory = useCallback((storyStructure: any) => {
      try {
        // Clear existing nodes and edges
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);

        console.log('🎯 Applying generated story:', {
          title: storyStructure.metadata.title,
          nodes: storyStructure.nodes.length,
          theme: storyStructure.metadata.theme
        });

        // Convert generated story structure to editor format with improved spacing
        const editorNodes = storyStructure.nodes.map((node: any) => {
          console.log(`📍 Node positioned: ${node.title} at (${node.position.x}, ${node.position.y})`);
          
          return {
            id: node.id,
            type: node.type === 'start' ? 'startNode' : 
                  node.type === 'end' ? 'endNode' : 'storyNode',
            position: {
              x: node.position.x,
              y: node.position.y
            },
            data: {
              storyNode: {
                id: node.id,
                title: node.title,
                content: node.content,
                choices: node.choices,
                multimedia: {},
                metadata: {
                  tags: [],
                  visitCount: 0,
                  difficulty: 'medium' as const,
                },
              },
              nodeType: node.type,
              isStartNode: node.type === 'start',
              isEndNode: node.type === 'end',
            },
            dragHandle: '.drag-handle',
          };
        });

        // Generate edges from choices with better organization
        const editorEdges: EditorEdge[] = [];
        editorNodes.forEach((node: any) => {
          node.data.storyNode.choices.forEach((choice: any) => {
            editorEdges.push({
              id: `edge-${node.id}-${choice.nextNodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              source: node.id,
              target: choice.nextNodeId,
              sourceHandle: choice.id,
              targetHandle: null,
              type: 'smoothstep',
              data: { choice },
              label: choice.text,
              labelStyle: { fill: '#ffffff', fontWeight: 600 },
              labelBgStyle: { fill: '#e94560', fillOpacity: 0.8 },
            });
          });
        });

        // Better project name management
        const generatedTitle = storyStructure.metadata.title || 'Generated Story';
        const cleanTitle = generatedTitle
          .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
          .trim()
          .substring(0, 50); // Limit length

        // Create or update project with preserved name
        const updatedProject: StoryProject = {
          id: currentProject?.id || `project-generated-${Date.now()}`,
          name: cleanTitle, // Use the AI-generated title
          description: storyStructure.metadata.description || `AI-generated ${storyStructure.metadata.genre} story - ${storyStructure.metadata.theme}`,
          nodes: editorNodes,
          edges: editorEdges,
          metadata: {
            createdAt: currentProject?.metadata.createdAt || new Date(),
            updatedAt: new Date(),
            version: currentProject?.metadata.version || '1.0.0',
            author: currentProject?.metadata.author || 'AI Generator',
            // ADD: Preserve AI generation metadata
            aiGenerated: true,
            originalTheme: storyStructure.metadata.theme,
            genre: storyStructure.metadata.genre,
            estimatedPlayTime: storyStructure.metadata.estimatedPlayTime,
          },
        };

        setCurrentProject(updatedProject);
        setNodes(editorNodes);
        setEdges(editorEdges);

        // Auto-save with better naming
        try {
          const serializedProject = {
            ...updatedProject,
            metadata: {
              ...updatedProject.metadata,
              createdAt: updatedProject.metadata.createdAt.toISOString(),
              updatedAt: updatedProject.metadata.updatedAt.toISOString(),
            },
          };

          // Save with descriptive name
          const saveKey = `asylum-project-${cleanTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          localStorage.setItem(saveKey, JSON.stringify(serializedProject));
          
          console.log('💾 Project auto-saved:', {
            key: saveKey,
            name: cleanTitle,
            nodes: editorNodes.length
          });

        } catch (saveError) {
          console.warn('⚠️ Auto-save error:', saveError);
        }

        showNotification(`✨ "${cleanTitle}" generated with ${storyStructure.metadata.totalNodes} nodes!`, 'success');
        
        // Force layout refresh to ensure proper positioning
        setTimeout(() => {
          console.log('🔄 Refreshing layout...');
          setNodes(currentNodes => [...currentNodes]);
          setEdges(currentEdges => [...currentEdges]);
        }, 500);

      } catch (error) {
        console.error('❌ Error applying bulk story:', error);
        showNotification('Error applying generated story', 'error');
      }
    }, [setNodes, setEdges, currentProject, showNotification]);

    // Function to clean up old auto-saves to prevent localStorage bloat
    const cleanupOldAutoSaves = useCallback(() => {
      try {
        const keysToRemove: string[] = [];
        const maxAutoSaves = 5; // Keep only 5 most recent auto-saves
        
        // Find all auto-save keys
        const autoSaveKeys: Array<{key: string, timestamp: number}> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('asylum-project-') && key.includes('auto')) {
            const match = key.match(/(\d+)$/);
            const timestamp = match ? parseInt(match[1]) : 0;
            autoSaveKeys.push({ key, timestamp });
          }
        }
        
        // Sort by timestamp and remove old ones
        autoSaveKeys.sort((a, b) => b.timestamp - a.timestamp);
        if (autoSaveKeys.length > maxAutoSaves) {
          const oldKeys = autoSaveKeys.slice(maxAutoSaves);
          oldKeys.forEach(({ key }) => {
            localStorage.removeItem(key);
            keysToRemove.push(key);
          });
        }
        
        if (keysToRemove.length > 0) {
          console.log('🧹 Cleaned up old auto-saves:', keysToRemove.length);
        }
      } catch (error) {
        console.warn('⚠️ Auto-save cleanup error:', error);
      }
    }, []);

    // Run cleanup on component mount
    React.useEffect(() => {
      cleanupOldAutoSaves();
    }, [cleanupOldAutoSaves]);

    const handleApplyAIContent = useCallback((generatedContent: string) => {
      if (!selectedNodeId) return;

      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              storyNode: {
                ...node.data.storyNode,
                content: generatedContent,
                metadata: {
                  ...node.data.storyNode.metadata,
                  lastModified: new Date().toISOString(),
                }
              }
            }
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      showNotification('AI content applied successfully!', 'success');
      
      // Auto-save after AI generation
      setTimeout(() => autoSave(), 1000);
    }, [selectedNodeId, nodes, setNodes, showNotification, autoSave]);

    // Create new project - Strict types
    const createNewProject = useCallback((): void => {
      setShowInitModal(true);
    }, []);

    // Enhanced save project function with better naming
    const saveProject = useCallback((): void => {
      if (!currentProject) {
        showNotification('No project to save!', 'error');
        return;
      }

      try {
        const updatedProject: StoryProject = {
          ...currentProject,
          nodes,
          edges,
          metadata: {
            ...currentProject.metadata,
            updatedAt: new Date(),
          },
        };

        setCurrentProject(updatedProject);

        // Better save key generation
        const cleanName = currentProject.name
          .replace(/[^a-zA-Z0-9\s\-_]/g, '')
          .trim()
          .substring(0, 30)
          .toLowerCase()
          .replace(/\s+/g, '-');

        const saveKey = currentProject.id.startsWith('asylum-project-')
          ? currentProject.id
          : `asylum-project-${cleanName}-${Date.now()}`;

        const serializedProject = {
          ...updatedProject,
          metadata: {
            ...updatedProject.metadata,
            createdAt: updatedProject.metadata.createdAt.toISOString(),
            updatedAt: updatedProject.metadata.updatedAt.toISOString(),
          },
        };

        localStorage.setItem(saveKey, JSON.stringify(serializedProject));

        if (onSave) {
          onSave(updatedProject);
        }

        showNotification(`✅ Project "${updatedProject.name}" saved!`, 'success');

        console.log('💾 Project saved:', {
          name: updatedProject.name,
          key: saveKey,
          nodes: nodes.length,
          edges: edges.length
        });

      } catch (error) {
        console.error('❌ Save error:', error);
        showNotification('Error during save', 'error');
      }
    }, [currentProject, nodes, edges, onSave, showNotification]);

    const handleExportProject = useCallback(
      (format: string): void => {
        if (!currentProject || nodes.length === 0) {
          showNotification('❌ No project to export!', 'error');
          return;
        }

        try {
          let exportData: any;
          let fileName: string;
          let mimeType: string;

          const projectData = {
            ...currentProject,
            nodes,
            edges,
            metadata: {
              ...currentProject.metadata,
              exportedAt: new Date(),
              exportFormat: format,
            },
          };

          switch (format) {
            case 'asylum-json':
              // Specific format for your game
              exportData = {
                version: '1.0.0',
                metadata: {
                  name: projectData.name,
                  description: projectData.description,
                  createdAt: projectData.metadata.createdAt.toISOString(),
                  exportedAt: new Date().toISOString(),
                  totalNodes: nodes.length,
                  totalEdges: edges.length,
                },
                story: projectData,
                // Add game-specific metadata if needed
                gameMetadata: {
                  startNodeId: nodes.find((n) => n.data.nodeType === 'start')
                    ?.id,
                  endNodeIds: nodes
                    .filter((n) => n.data.nodeType === 'end')
                    .map((n) => n.id),
                },
              };
              fileName = `${projectData.name.replace(/[^a-z0-9]/gi, '_')}_asylum.json`;
              mimeType = 'application/json';
              break;

            case 'json':
              // Standard JSON format
              exportData = projectData;
              fileName = `${projectData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
              mimeType = 'application/json';
              break;

            case 'twine':
              // Twine-compatible format (Twee notation)
              const startNode = nodes.find((n) => n.data.nodeType === 'start');
              if (!startNode) {
                throw new Error('No start node found');
              }

              let twineContent = `:: Start\n${startNode.data.storyNode.content}\n\n`;

              // Generate Twine content for each node
              nodes.forEach((node) => {
                if (node.data.nodeType !== 'start') {
                  const title = node.data.storyNode.title.replace(
                    /[^a-zA-Z0-9\s]/g,
                    ''
                  );
                  twineContent += `:: ${title}\n`;
                  twineContent += `${node.data.storyNode.content}\n`;

                  // Add choices
                  node.data.storyNode.choices.forEach((choice) => {
                    const targetNode = nodes.find(
                      (n) => n.id === choice.nextNodeId
                    );
                    if (targetNode) {
                      const targetTitle =
                        targetNode.data.storyNode.title.replace(
                          /[^a-zA-Z0-9\s]/g,
                          ''
                        );
                      twineContent += `[[${choice.text}|${targetTitle}]]\n`;
                    }
                  });
                  twineContent += '\n';
                }
              });

              exportData = twineContent;
              fileName = `${projectData.name.replace(/[^a-z0-9]/gi, '_')}.twee`;
              mimeType = 'text/plain';
              break;

            default:
              throw new Error(`Unsupported export format: ${format}`);
          }

          // Create and download file
          const blob = new Blob(
            [
              typeof exportData === 'string'
                ? exportData
                : JSON.stringify(exportData, null, 2),
            ],
            { type: mimeType }
          );

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Success notification
          showNotification(
            `✅ Project exported as ${format.toUpperCase()}!`,
            'success'
          );

          console.log(`📦 Export ${format} successful:`, fileName);
        } catch (error) {
          console.error('❌ Export error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          showNotification(`❌ Export error: ${errorMessage}`, 'error');
        }
      },
      [currentProject, nodes, edges, showNotification]
    );

    const handleLoadProject = useCallback(
      (project: StoryProject): void => {
        try {
          setCurrentProject(project);
          setNodes(project.nodes || []);
          setEdges(project.edges || []);
          setSelectedNode(null);
          setSelectedNodeId(null); // Reset AI selection
          setIsNodeEditorOpen(false);
          setIsProjectInitialized(true);

          showNotification(`✅ Project "${project.name}" loaded!`, 'success');
          console.log('📂 Project loaded:', project.name);
        } catch (error) {
          console.error('❌ Load error:', error);
          showNotification('Error during loading', 'error');
        }
      },
      [setNodes, setEdges, showNotification]
    );

    // NEW CORRECTED TEST FUNCTION with dynamicStoryManager
    const testStory = useCallback((): void => {
      try {
        if (nodes.length === 0) {
          alert("❌ No nodes to test! Create your story first.");
          return;
        }

        // Validation with local function
        const validation = validateStoryForTest();
        
        if (validation.errors.length > 0) {
          const errorMessage =
            "Cannot test the story:\n\n" +
            validation.errors.join('\n');
          alert(errorMessage);
          return;
        }

        // Show warnings but allow testing
        if (validation.warnings.length > 0) {
          const warningMessage =
            'Warnings detected:\n\n' +
            validation.warnings.join('\n') +
            '\n\nContinue testing anyway?';
          if (!window.confirm(warningMessage)) {
            return;
          }
        }

        console.log("🧪 Starting story test...");

        // Convert the current editor state to story format
        const conversionResult = GraphToStoryConverter.convert(nodes, edges);

        // Check for critical errors
        if (conversionResult.errors.length > 0) {
          const errorMessage =
            "Cannot test the story:\n\n" +
            conversionResult.errors.join('\n');
          alert(errorMessage);
          return;
        }

        // Show warnings but allow testing
        if (conversionResult.warnings.length > 0) {
          const warningMessage =
            'Warnings detected:\n\n' +
            conversionResult.warnings.join('\n') +
            '\n\nContinue testing anyway?';
          if (!window.confirm(warningMessage)) {
            return;
          }
        }

        // Create a temporary story in the dynamic manager for testing
        const createTestStory = async () => {
          try {
            // Create a temporary test story
            const testStoryProject = {
              metadata: {
                id: 'test-story-' + Date.now(),
                title: (currentProject?.name || 'Test Story') + ' (Test)',
                description: 'Test version of story from editor',
                author: 'Editor User',
                version: '1.0.0',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                estimatedPlayTime: '5-15 min',
                difficulty: 'Medium' as const,
                tags: ['test', 'editor'],
                rating: 0,
                totalNodes: conversionResult.story.length,
                featured: false,
                published: true // Temporarily publish for testing
              },
              story: conversionResult.story,
              startNodeId: conversionResult.startNodeId
            };

            console.log('🔧 Creating test story:', testStoryProject.metadata.title);

            // Save the test story
            await dynamicStoryManager.saveStory(testStoryProject);

            console.log('✅ Test story saved, opening...');

            // Open the test story in a new tab/window
            const testUrl = new URL('/', window.location.origin);
            testUrl.searchParams.set('testStory', testStoryProject.metadata.id);

            const newWindow = window.open(testUrl.toString(), '_blank');

            if (!newWindow) {
              // Fallback if popups are blocked
              alert(
                'Popups are blocked. The test story has been created.\nGo to the main page and look for: "' + 
                testStoryProject.metadata.title + '"'
              );
              return;
            }

            console.log('✅ Test story created and launched:', testStoryProject.metadata.id);

            // Clean up the test story after a delay
            setTimeout(async () => {
              try {
                await dynamicStoryManager.deleteStory(testStoryProject.metadata.id);
                console.log('🧹 Test story cleaned up');
              } catch (error) {
                console.warn('⚠️ Failed to clean up test story:', error);
              }
            }, 5 * 60 * 1000); // Clean up after 5 minutes

          } catch (error) {
            console.error('❌ Failed to create test story:', error);
            alert('Failed to create test story. Please try publishing instead.');
          }
        };

        // Execute the test story creation
        createTestStory();

      } catch (error: unknown) {
        console.error('❌ Test error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Test failed: ${errorMessage}`);
      }
    }, [nodes, edges, currentProject, validateStoryForTest]);

    // Intelligent auto-arrangement of nodes - Strict types
    const autoArrange = useCallback((): void => {
      if (nodes.length === 0) {
        alert('❌ No nodes to organize!');
        return;
      }

      const startNodes = nodes.filter((node) => node.data.nodeType === 'start');

      if (startNodes.length === 0) {
        // Simple grid arrangement
        const layoutedNodes = nodes.map((node, index) => ({
          ...node,
          position: {
            x: (index % 4) * 300 + 100,
            y: Math.floor(index / 4) * 200 + 100,
          },
        }));
        setNodes(layoutedNodes);
        return;
      }

      // Hierarchical arrangement based on story structure
      const visited = new Set<string>();
      const positioned = new Map<string, { x: number; y: number }>();
      const startNode = startNodes[0];

      if (!startNode) return;

      // Recursive breadth-first positioning
      const positionNodes = (
        nodeId: string,
        level: number,
        position: number
      ): void => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const x = 100 + position * 300;
        const y = 50 + level * 200;
        positioned.set(nodeId, { x, y });

        // Find child nodes
        const childEdges = edges.filter((edge) => edge.source === nodeId);
        childEdges.forEach((edge, index) => {
          positionNodes(edge.target, level + 1, position + index);
        });
      };

      positionNodes(startNode.id, 0, 0);

      // Apply new positions
      const layoutedNodes = nodes.map((node) => ({
        ...node,
        position: positioned.get(node.id) || node.position,
      }));

      setNodes(layoutedNodes);
    }, [nodes, edges, setNodes]);

    // Request notification permission with verification
    React.useEffect(() => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission().catch((error) => {
          console.warn('Notification permission denied:', error);
        });
      }
    }, []);

    React.useEffect(() => {
      if (isProjectInitialized && currentProject && nodes.length === 0) {
        // Check that it's really a new project
        if (currentProject.nodes.length === 0) {
          createNode('start', { x: 250, y: 100 });
        }
      }
    }, [isProjectInitialized, currentProject, nodes.length, createNode]);

    return (
      <div className="flex h-screen flex-col bg-gray-900">
        {/* Toolbar - Added AI generation props */}
        <EditorToolbar
          onCreateNode={createNode}
          onNewProject={createNewProject}
          onSaveProject={saveProject}
          onLoadProject={handleToolbarLoadProject}
          onExportProject={handleExportProject}
          onAutoArrange={autoArrange}
          onTestStory={testStory}
          onAIGenerate={handleAIGenerate} // AI generation handler
          onBulkGenerate={handleBulkGenerate} // Bulk generation handler
          currentProject={currentProject}
          nodes={memoizedNodes}
          edges={memoizedEdges}
          hasSelectedNode={selectedNodeId !== null} // Pass selection state
        />

        {/* Main Editor */}
        <div className="flex flex-1">
          {/* Canvas */}
          <div className="relative flex-1">
            <ReactFlow
              nodes={memoizedNodes as Node[]} // Type assertion for React Flow v12 compatibility
              edges={memoizedEdges as any[]} // Type assertion for React Flow v12 compatibility
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={onPaneClick} // Handle pane click for deselection
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              className="bg-gray-800"
              selectNodesOnDrag={false}
              multiSelectionKeyCode={null}
              deleteKeyCode={['Delete', 'Backspace']}
              connectionLineStyle={{ stroke: '#e94560', strokeWidth: 3 }}
              connectionLineType={ConnectionLineType.SmoothStep}
              // Add properties to improve UX
              connectionRadius={20}
              snapToGrid={true}
              snapGrid={[15, 15]}
              attributionPosition="bottom-right"
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#374151" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#e94560"
                maskColor="rgba(0, 0, 0, 0.2)"
                className="bg-gray-700"
              />

              {/* Enhanced information panel */}
              <Panel
                position="top-right"
                className="max-w-xs rounded-lg bg-gray-800 p-4 text-white"
              >
                <div className="text-sm">
                  <div className="mb-2 font-medium">
                    Project: {currentProject?.name || 'Untitled'}
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>Nodes: {nodes.length}</div>
                    <div>Connections: {edges.length}</div>
                    <div>
                      Start:{' '}
                      {nodes.filter((n) => n.data.nodeType === 'start').length}
                    </div>
                    <div>
                      End:{' '}
                      {nodes.filter((n) => n.data.nodeType === 'end').length}
                    </div>
                    {/* Show AI selection status */}
                    {selectedNodeForAI && (
                      <div className="mt-2 border-t border-gray-600 pt-2">
                        <div className="font-medium text-green-400">
                          AI Ready:
                        </div>
                        <div className="truncate text-xs text-gray-300">
                          {selectedNodeForAI.data.storyNode.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {selectedNodeForAI.data.nodeType}
                        </div>
                      </div>
                    )}
                    {selectedNode && !selectedNodeForAI && (
                      <div className="mt-2 border-t border-gray-600 pt-2">
                        <div className="font-medium text-white">
                          Selected:
                        </div>
                        <div className="truncate text-xs text-gray-300">
                          {selectedNode.data.storyNode.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {selectedNode.data.nodeType}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Help panel for keyboard shortcuts */}
              <Panel
                position="bottom-right"
                className="max-w-sm rounded-lg bg-gray-800 p-3 text-xs text-white"
              >
                <div className="mb-2 font-medium">💡 Shortcuts</div>
                <div className="space-y-1 text-gray-300">
                  <div>• Double-click: Edit node</div>
                  <div>• Del/Backspace: Delete</div>
                  <div>• Drag: Move nodes</div>
                  <div>• Ctrl+S: Save</div>
                  <div>• Escape: Close editor</div>
                  <div>• Click node + AI: Generate content</div>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Node Editor */}
          {isNodeEditorOpen && selectedNode && (
            <NodeEditor
              node={selectedNode}
              onSave={saveNodeEdit}
              onClose={() => setIsNodeEditorOpen(false)}
              onDelete={() => deleteNode(selectedNode.id)}
              onDuplicate={() => duplicateNode(selectedNode)}
            />
          )}
        </div>

        {/* Project loading modal */}
        <LoadProjectModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          onLoadProject={handleLoadProject}
        />

        {/* Project initialization modal */}
        <ProjectInitModal
          isOpen={showInitModal}
          onCreateNew={handleCreateNewProject}
          onLoadExisting={handleLoadExistingProject}
          allowClose={isProjectInitialized}
          onClose={
            isProjectInitialized ? () => setShowInitModal(false) : undefined
          }
        />

        {/* Choice modal */}
        <ChoiceModal
          isOpen={choiceModal.isOpen}
          targetNodeTitle={choiceModal.targetNodeTitle}
          onConfirm={handleChoiceConfirm}
          onCancel={handleChoiceCancel}
        />

        {/* AI Generation Modal */}
        <AIGenerationModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onGenerate={handleApplyAIContent}
          selectedNodeId={selectedNodeId}
          selectedNodeType={selectedNodeForAI?.data?.nodeType || null}
        />

        {/* Bulk Story Generator Modal */}
        <BulkStoryGeneratorModal
          isOpen={isBulkGeneratorOpen}
          onClose={() => setIsBulkGeneratorOpen(false)}
          onGenerate={handleApplyBulkStory}
        />

        {/* Save notification */}
        <SaveNotification
          isVisible={notification.isVisible}
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />

        {/* Global keyboard shortcut handling */}
        <div
          className="sr-only"
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 's':
                  e.preventDefault();
                  saveProject();
                  break;
                case 'n':
                  e.preventDefault();
                  createNewProject();
                  break;
                case 'o': // Shortcut to open
                  e.preventDefault();
                  handleToolbarLoadProject();
                  break;
                case 't':
                  e.preventDefault();
                  testStory();
                  break;
                case 'g': // AI generation shortcut
                  e.preventDefault();
                  handleAIGenerate();
                  break;
                case 'b': // Bulk generation shortcut
                  e.preventDefault();
                  handleBulkGenerate();
                  break;
                default:
                  break;
              }
            } else if (e.key === 'Escape') {
              setIsNodeEditorOpen(false);
              setShowLoadModal(false); // Close load modal
              setIsAIModalOpen(false); // Close AI modal
              setIsBulkGeneratorOpen(false); // Close bulk generator modal
            }
          }}
          tabIndex={-1}
        />
      </div>
    );
  }
);

StoryEditorContent.displayName = 'StoryEditorContent';

// Main wrapper with error handling
export function StoryEditor(props: StoryEditorProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <React.Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <div>Loading editor...</div>
            </div>
          </div>
        }
      >
        <StoryEditorContent {...props} />
      </React.Suspense>
    </ReactFlowProvider>
  );
}

export { StoryEditorContent };