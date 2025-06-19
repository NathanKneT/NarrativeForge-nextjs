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
// 🔧 FIX: Import the dynamic story manager
import { dynamicStoryManager } from '@/lib/dynamicStoryManager';

// Types de nœuds personnalisés avec types stricts compatibles React Flow v12
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

// Interface pour la modal de choix avec types stricts
interface ChoiceModalProps {
  isOpen: boolean;
  targetNodeTitle: string;
  onConfirm: (choiceText: string) => void;
  onCancel: () => void;
}

// Composant Modal pour saisir les choix - Types stricts
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
      alert('❌ Le texte du choix est obligatoire !');
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
        <h3 className="mb-4 text-lg font-bold text-white">Nouveau choix</h3>
        <p className="mb-4 text-gray-300">
          Quel est le texte du choix pour aller vers "{targetNodeTitle}" ?
        </p>
        <input
          type="text"
          value={choiceText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setChoiceText(e.target.value)
          }
          placeholder="Ex: Aller à droite"
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
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            type="button"
          >
            Créer le choix
          </button>
        </div>
      </div>
    </div>
  );
};

const StoryEditorContent = forwardRef<StoryEditorRef, StoryEditorProps>(
  ({ onSave, onLoad, onExport, onDataUpdate }, ref) => {
    // Utilisation correcte des hooks React Flow avec types stricts
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

    // État pour la modal de choix avec types stricts
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

    // 🔧 FIX: Add validation function for story testing
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
          if (!hasOutgoingConnection && node.data?.nodeType !== 'end') {
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

    // Exposer les données via ref avec types stricts
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

    // 🔧 FIX: Sauvegarder automatiquement dans localStorage avec gestion d'erreurs typée
    const autoSave = useCallback((): void => {
      if (nodes.length > 0) {
        const autoSaveProject: StoryProject = {
          id: 'auto-save',
          name: 'Sauvegarde automatique',
          description: 'Projet sauvegardé automatiquement',
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
            console.log('💾 Auto-sauvegarde effectuée');
          }
        } catch (error: unknown) {
          console.warn('❌ Erreur auto-sauvegarde:', error);
        }
      }
    }, [nodes, edges]);

    React.useEffect(() => {
      // Petit délai pour laisser React Flow se mettre à jour
      const timeoutId = setTimeout(() => {
        // Déclencher un re-render des edges en les "touchant"
        setEdges((currentEdges) => [...currentEdges]);
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [nodes, setEdges]);

    // Vérifier s'il y a un projet auto-sauvegardé au démarrage
    React.useEffect(() => {
      const checkExistingProject = () => {
        try {
          const savedProject = localStorage.getItem('asylum-editor-autosave');
          if (savedProject) {
            const parsed = JSON.parse(savedProject);
            if (parsed.nodes && parsed.nodes.length > 0) {
              // Il y a un projet existant, ne pas montrer la modal et le charger directement
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
                '📂 Projet auto-sauvegardé restauré:',
                restoredProject.name
              );
              return;
            }
          }
        } catch (error) {
          console.warn(
            '⚠️ Erreur lors de la vérification du projet existant:',
            error
          );
          localStorage.removeItem('asylum-editor-autosave');
        }
      };

      checkExistingProject();
    }, [setNodes, setEdges]);

    // Auto-sauvegarde toutes les 30 secondes
    React.useEffect(() => {
      const interval = setInterval(autoSave, 30000);
      return () => clearInterval(interval);
    }, [autoSave]);

    // Notifier les changements pour l'export avec types stricts
    React.useEffect(() => {
      if (onDataUpdate) {
        onDataUpdate(nodes, edges, currentProject);
      }

      // Mettre à jour la référence pour l'export
      editorDataRef.current = { nodes, edges, project: currentProject };
    }, [nodes, edges, currentProject, onDataUpdate]);

    // Mémorisation pour optimiser les performances
    const memoizedNodes = useMemo(() => nodes, [nodes]);
    const memoizedEdges = useMemo(() => edges, [edges]);

    // 🔧 FIX: Gestionnaire de connexion avec modal - Types stricts
    const onConnect: OnConnect = useCallback(
      (params: Connection) => {
        console.log('🔍 onConnect called with params:', {
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        });

        // Validation stricte des paramètres avec type guards
        if (
          !params.source ||
          !params.target ||
          typeof params.source !== 'string' ||
          typeof params.target !== 'string'
        ) {
          console.warn(
            '❌ Connection invalide: source ou target manquant ou invalide'
          );
          return;
        }

        const sourceNode = nodes.find((node) => node.id === params.source);
        const targetNode = nodes.find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) {
          console.warn('❌ Nœuds source ou target non trouvés');
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

        // Éviter les auto-connexions
        if (params.source === params.target) {
          console.warn('❌ Auto-connexion interdite');
          return;
        }

        // Vérifier que le nœud source n'est pas un nœud de fin
        if (sourceNode.data.nodeType === 'end') {
          alert('❌ Impossible de créer une connexion depuis un nœud de fin !');
          return;
        }

        // Vérifier qu'il n'y a pas déjà une connexion entre ces nœuds
        const existingConnection = edges.find(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );
        if (existingConnection) {
          alert('❌ Une connexion existe déjà entre ces nœuds !');
          return;
        }

        console.log('✅ Opening choice modal for connection');

        // Ouvrir la modal pour saisir le choix
        setChoiceModal({
          isOpen: true,
          targetNodeTitle: targetNode.data.storyNode.title,
          connectionParams: params,
        });
      },
      [nodes, edges]
    );

    // Fonction pour confirmer le choix depuis la modal avec types stricts
    const handleChoiceConfirm = useCallback(
      (choiceText: string): void => {
        const params = choiceModal.connectionParams;
        if (!params || !params.source || !params.target) return;

        // ✅ FIX: Gérer TOUS les types de sourceHandle
        const sourceHandle = params.sourceHandle;
        const isDefaultHandle = sourceHandle?.includes('-default-source');

        console.log('🔍 Connection analysis:', {
          sourceHandle: sourceHandle,
          isDefaultHandle: isDefaultHandle,
          source: params.source,
          target: params.target,
        });

        // ✅ FIX: Si c'est un handle par défaut, on le remplace par un choix spécifique
        if (isDefaultHandle) {
          // Utiliser l'ID du handle par défaut comme sourceHandle
          const newEdge: EditorEdge = {
            id: `edge-${params.source}-${params.target}-${Date.now()}`,
            source: params.source,
            target: params.target,
            sourceHandle: sourceHandle, // ✅ Garder le handle par défaut existant
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

          // Ajouter l'edge
          setEdges((eds) => addEdge(newEdge, eds));

          // ✅ FIX: Mettre à jour le nœud source - AJOUTER le choix sans changer les handles existants
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === params.source) {
                const newChoice: Choice = {
                  // ✅ Type explicite Choice
                  id: sourceHandle ?? `choice-${Date.now()}`, // ✅ Gérer null avec fallback
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
                } as EditorNode; // ✅ Cast explicite pour assurer le type
              }
              return node;
            })
          );

          console.log('✅ Connexion créée avec handle par défaut:', {
            choiceText,
            sourceHandle: sourceHandle,
            type: 'default-handle',
          });
        } else {
          // ✅ FIX: Handle spécifique - logique normale
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

          console.log('✅ Connexion créée avec handle spécifique:', {
            choiceText,
            choiceId: uniqueChoiceId,
            type: 'specific-handle',
          });
        }

        // ✅ FIX: Re-render forcé avec délai plus long
        setTimeout(() => {
          setEdges((currentEdges) => {
            console.log('🔄 Force re-render edges:', currentEdges.length);
            return [...currentEdges];
          });
          setNodes((currentNodes) => {
            console.log('🔄 Force re-render nodes:', currentNodes.length);
            return [...currentNodes];
          });
        }, 150); // Délai plus long pour React Flow

        // Fermer la modal
        setChoiceModal({
          isOpen: false,
          targetNodeTitle: '',
          connectionParams: null,
        });
      },
      [choiceModal, setEdges, setNodes]
    );

    // Fonction pour annuler la modal
    const handleChoiceCancel = useCallback((): void => {
      setChoiceModal({
        isOpen: false,
        targetNodeTitle: '',
        connectionParams: null,
      });
    }, []);

    // 🔧 FIX: Créer un nouveau nœud avec validation - Types stricts
    const createNode = useCallback(
      (
        type: 'start' | 'story' | 'end',
        position = { x: 0, y: 0 }
      ): EditorNode | null => {
        // Vérifier qu'il n'y a qu'un seul nœud de début
        if (!isProjectInitialized) {
          alert("❌ Veuillez d'abord créer ou charger un projet !");
          setShowInitModal(true);
          return null;
        }
        if (type === 'start') {
          const existingStartNodes = nodes.filter(
            (node) => node.data.nodeType === 'start'
          );
          if (existingStartNodes.length > 0) {
            alert(
              "Il ne peut y avoir qu'un seul nœud de début. Supprimez l'existant d'abord."
            );
            return null;
          }
        }

        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const baseStoryNode: StoryNode = {
          id: nodeId,
          title:
            type === 'start'
              ? "Début de l'histoire"
              : type === 'end'
                ? "Fin de l'histoire"
                : 'Nouvelle scène',
          content:
            type === 'start'
              ? 'Le début de votre histoire...'
              : type === 'end'
                ? "Fin de l'histoire."
                : 'Contenu de la scène...',
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

        // 🔍 DEBUG: Ajoutez ces logs
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

    const handleCreateNewProject = useCallback(
      (projectName: string, description: string) => {
        const newProject: StoryProject = {
          id: `project-${Date.now()}`,
          name: projectName,
          description: description,
          nodes: [],
          edges: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
          },
        };

        setCurrentProject(newProject);
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setIsNodeEditorOpen(false);
        setShowInitModal(false);
        setIsProjectInitialized(true);

        console.log('✅ Nouveau projet créé:', projectName);

        setTimeout(() => {
          // Force la mise à jour immédiate du state avant de créer le nœud
          setIsProjectInitialized(true);
        }, 50);
      },
      [createNode, setNodes, setEdges]
    );

    const handleLoadExistingProject = useCallback(() => {
      setShowInitModal(false);
      setShowLoadModal(true);
    }, []);

    const handleToolbarLoadProject = useCallback(() => {
      setShowLoadModal(true);
    }, []);

    // 🔧 FIX: Supprimer un nœud avec nettoyage des edges et choix - Types stricts
    const deleteNode = useCallback(
      (nodeId: string): void => {
        // Vérifier si c'est le dernier nœud de début
        const nodeToDelete = nodes.find((n) => n.id === nodeId);
        if (nodeToDelete?.data.nodeType === 'start') {
          const startNodes = nodes.filter((n) => n.data.nodeType === 'start');
          if (startNodes.length === 1) {
            const confirm = window.confirm(
              "⚠️ Vous supprimez le dernier nœud de début. Votre histoire n'aura plus de point d'entrée. Continuer ?"
            );
            if (!confirm) return;
          }
        }

        // Supprimer le nœud
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));

        // Supprimer les edges connectées
        const edgesToRemove = edges.filter(
          (edge) => edge.source === nodeId || edge.target === nodeId
        );
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );

        // Mettre à jour les choix des nœuds sources
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

        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
          setIsNodeEditorOpen(false);
        }
      },
      [setNodes, setEdges, selectedNode, edges, nodes]
    );

    // Dupliquer un nœud - Types stricts
    const duplicateNode = useCallback(
      (node: EditorNode): EditorNode => {
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 🔧 FIX: Ne pas dupliquer les nœuds de début
        if (node.data.nodeType === 'start') {
          alert('❌ Impossible de dupliquer le nœud de début !');
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
              title: `${node.data.storyNode.title} (copie)`,
              choices: [], // 🔧 FIX: Réinitialiser les choix pour éviter les conflits
            },
          },
        };

        setNodes((nds) => [...nds, newNode]);
        return newNode;
      },
      [setNodes]
    );

    // Gestionnaires d'événements optimisés avec types stricts compatibles React Flow v12
    const onNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node): void => {
        // Type assertion sécurisée pour EditorNode
        const editorNode = node as EditorNode;
        setSelectedNode(editorNode);
      },
      []
    );

    const onNodeDoubleClick = useCallback(
      (_event: React.MouseEvent, node: Node): void => {
        // Type assertion sécurisée pour EditorNode
        const editorNode = node as EditorNode;
        setSelectedNode(editorNode);
        setIsNodeEditorOpen(true);
      },
      []
    );

    // Gestionnaires de changements avec types stricts - CORRIGÉS pour React Flow v12
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

    // Sauvegarder le nœud édité avec mise à jour des edges - Types stricts
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

        // Mettre à jour les labels des edges correspondantes
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

    // Créer un nouveau projet - Types stricts
    const createNewProject = useCallback((): void => {
      setShowInitModal(true);
    }, []);

    // Sauvegarder le projet - Types stricts
    const saveProject = useCallback((): void => {
      if (!currentProject) {
        showNotification('Aucun projet à sauvegarder !', 'error');
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

        // ✅ ADD: Sauvegarder dans localStorage avec un ID unique
        const projectId = currentProject.id.startsWith('asylum-project-')
          ? currentProject.id
          : `asylum-project-${currentProject.id}`;

        const serializedProject = {
          ...updatedProject,
          metadata: {
            ...updatedProject.metadata,
            createdAt: updatedProject.metadata.createdAt.toISOString(),
            updatedAt: updatedProject.metadata.updatedAt.toISOString(),
          },
        };

        localStorage.setItem(projectId, JSON.stringify(serializedProject));

        if (onSave) {
          onSave(updatedProject);
        }

        // ✅ ADD: Afficher notification de succès
        showNotification(
          `✅ Projet "${updatedProject.name}" sauvegardé !`,
          'success'
        );

        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Projet sauvegardé:', updatedProject.name);
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
      }
    }, [currentProject, nodes, edges, onSave, showNotification]);

    const handleExportProject = useCallback(
      (format: string): void => {
        if (!currentProject || nodes.length === 0) {
          showNotification('❌ Aucun projet à exporter !', 'error');
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
              // Format spécifique pour votre jeu
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
                // Ajouter des métadonnées spécifiques au jeu si nécessaire
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
              // Format JSON standard
              exportData = projectData;
              fileName = `${projectData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
              mimeType = 'application/json';
              break;

            case 'twine':
              // Format compatible Twine (Twee notation)
              const startNode = nodes.find((n) => n.data.nodeType === 'start');
              if (!startNode) {
                throw new Error('Aucun nœud de début trouvé');
              }

              let twineContent = `:: Start\n${startNode.data.storyNode.content}\n\n`;

              // Générer le contenu Twine pour chaque nœud
              nodes.forEach((node) => {
                if (node.data.nodeType !== 'start') {
                  const title = node.data.storyNode.title.replace(
                    /[^a-zA-Z0-9\s]/g,
                    ''
                  );
                  twineContent += `:: ${title}\n`;
                  twineContent += `${node.data.storyNode.content}\n`;

                  // Ajouter les choix
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
              throw new Error(`Format d'export non supporté: ${format}`);
          }

          // Créer et télécharger le fichier
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

          // Notification de succès
          showNotification(
            `✅ Projet exporté en ${format.toUpperCase()} !`,
            'success'
          );

          console.log(`📦 Export ${format} réussi:`, fileName);
        } catch (error) {
          console.error('❌ Erreur export:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Erreur inconnue';
          showNotification(`❌ Erreur export: ${errorMessage}`, 'error');
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
          setIsNodeEditorOpen(false);
          setIsProjectInitialized(true);

          showNotification(`✅ Projet "${project.name}" chargé !`, 'success');
          console.log('📂 Projet chargé:', project.name);
        } catch (error) {
          console.error('❌ Erreur chargement:', error);
          showNotification('Erreur lors du chargement', 'error');
        }
      },
      [setNodes, setEdges, showNotification]
    );

    // 🔧 FIX: NOUVELLE FONCTION DE TEST CORRIGÉE avec dynamicStoryManager
    const testStory = useCallback((): void => {
      try {
        if (nodes.length === 0) {
          alert("❌ No nodes to test! Create your story first.");
          return;
        }

        // Validation avec la fonction locale
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

        // 🔧 FIX: Create a temporary story in the dynamic manager for testing
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

    // Auto-arrangement intelligent des nœuds - Types stricts
    const autoArrange = useCallback((): void => {
      if (nodes.length === 0) {
        alert('❌ Aucun nœud à organiser !');
        return;
      }

      const startNodes = nodes.filter((node) => node.data.nodeType === 'start');

      if (startNodes.length === 0) {
        // Arrangement en grille simple
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

      // Arrangement hiérarchique basé sur la structure de l'histoire
      const visited = new Set<string>();
      const positioned = new Map<string, { x: number; y: number }>();
      const startNode = startNodes[0];

      if (!startNode) return;

      // Positionnement récursif en largeur d'abord
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

        // Trouver les nœuds enfants
        const childEdges = edges.filter((edge) => edge.source === nodeId);
        childEdges.forEach((edge, index) => {
          positionNodes(edge.target, level + 1, position + index);
        });
      };

      positionNodes(startNode.id, 0, 0);

      // Appliquer les nouvelles positions
      const layoutedNodes = nodes.map((node) => ({
        ...node,
        position: positioned.get(node.id) || node.position,
      }));

      setNodes(layoutedNodes);
    }, [nodes, edges, setNodes]);

    // 🔧 FIX: Demander permission pour les notifications avec vérification
    React.useEffect(() => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission().catch((error) => {
          console.warn('Permission notification refusée:', error);
        });
      }
    }, []);

    React.useEffect(() => {
      if (isProjectInitialized && currentProject && nodes.length === 0) {
        // Vérifier que c'est vraiment un nouveau projet
        if (currentProject.nodes.length === 0) {
          createNode('start', { x: 250, y: 100 });
        }
      }
    }, [isProjectInitialized, currentProject, nodes.length, createNode]);

    return (
      <div className="flex h-screen flex-col bg-gray-900">
        {/* Toolbar */}
        <EditorToolbar
          onCreateNode={createNode}
          onNewProject={createNewProject}
          onSaveProject={saveProject}
          onLoadProject={handleToolbarLoadProject}
          onExportProject={handleExportProject}
          onAutoArrange={autoArrange}
          onTestStory={testStory}
          currentProject={currentProject}
          nodes={memoizedNodes}
          edges={memoizedEdges}
        />

        {/* Main Editor */}
        <div className="flex flex-1">
          {/* Canvas */}
          <div className="relative flex-1">
            <ReactFlow
              nodes={memoizedNodes as Node[]} // Type assertion pour compatibilité React Flow v12
              edges={memoizedEdges as any[]} // Type assertion pour compatibilité React Flow v12
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              className="bg-gray-800"
              selectNodesOnDrag={false}
              multiSelectionKeyCode={null}
              deleteKeyCode={['Delete', 'Backspace']}
              connectionLineStyle={{ stroke: '#e94560', strokeWidth: 3 }}
              connectionLineType={ConnectionLineType.SmoothStep}
              // 🔧 FIX: Ajout de propriétés pour améliorer l'UX
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

              {/* Panel d'informations amélioré */}
              <Panel
                position="top-right"
                className="max-w-xs rounded-lg bg-gray-800 p-4 text-white"
              >
                <div className="text-sm">
                  <div className="mb-2 font-medium">
                    Projet: {currentProject?.name || 'Sans nom'}
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>Nœuds: {nodes.length}</div>
                    <div>Connexions: {edges.length}</div>
                    <div>
                      Début:{' '}
                      {nodes.filter((n) => n.data.nodeType === 'start').length}
                    </div>
                    <div>
                      Fins:{' '}
                      {nodes.filter((n) => n.data.nodeType === 'end').length}
                    </div>
                    {selectedNode && (
                      <div className="mt-2 border-t border-gray-600 pt-2">
                        <div className="font-medium text-white">
                          Sélectionné:
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

              {/* 🔧 FIX: Panel d'aide pour les raccourcis clavier */}
              <Panel
                position="bottom-right"
                className="max-w-sm rounded-lg bg-gray-800 p-3 text-xs text-white"
              >
                <div className="mb-2 font-medium">💡 Raccourcis</div>
                <div className="space-y-1 text-gray-300">
                  <div>• Double-clic: Éditer nœud</div>
                  <div>• Del/Backspace: Supprimer</div>
                  <div>• Drag: Déplacer nœuds</div>
                  <div>• Ctrl+S: Sauvegarder</div>
                  <div>• Escape: Fermer éditeur</div>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Éditeur de nœud */}
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

        {/* ✅ ADD: Modal de chargement de projets */}
        <LoadProjectModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          onLoadProject={handleLoadProject}
        />

        {/* Modal d'initialisation de projet */}
        <ProjectInitModal
          isOpen={showInitModal}
          onCreateNew={handleCreateNewProject}
          onLoadExisting={handleLoadExistingProject}
          allowClose={isProjectInitialized}
          onClose={
            isProjectInitialized ? () => setShowInitModal(false) : undefined
          }
        />

        {/* Modal de choix */}
        <ChoiceModal
          isOpen={choiceModal.isOpen}
          targetNodeTitle={choiceModal.targetNodeTitle}
          onConfirm={handleChoiceConfirm}
          onCancel={handleChoiceCancel}
        />

        {/* ✅ ADD: Notification de sauvegarde */}
        <SaveNotification
          isVisible={notification.isVisible}
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />

        {/* 🔧 FIX: Gestion des raccourcis clavier globaux */}
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
                case 'o': // ✅ ADD: Raccourci pour ouvrir
                  e.preventDefault();
                  handleToolbarLoadProject();
                  break;
                case 't':
                  e.preventDefault();
                  testStory();
                  break;
                default:
                  break;
              }
            } else if (e.key === 'Escape') {
              setIsNodeEditorOpen(false);
              setShowLoadModal(false); // ✅ ADD: Fermer modal de chargement
            }
          }}
          tabIndex={-1}
        />
      </div>
    );
  }
);

StoryEditorContent.displayName = 'StoryEditorContent';

// 🔧 FIX: Wrapper principal avec gestion d'erreurs
export function StoryEditor(props: StoryEditorProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <React.Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <div>Chargement de l'éditeur...</div>
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
        