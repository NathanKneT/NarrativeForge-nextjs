'use client';

import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
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
import { StoryNode } from '@/types/story';
import { EditorToolbar } from './editor/EditorToolbar';
import { NodeEditor } from './editor/NodeEditor';
import { StoryNodeComponent } from './editor/StoryNodeComponent';
import { StartNodeComponent } from './editor/StartNodeComponent';
import { EndNodeComponent } from './editor/EndNodeComponent';
import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';

// Types de nœuds personnalisés avec types stricts compatibles React Flow v12
const nodeTypes = {
  storyNode: StoryNodeComponent as React.ComponentType<any>,
  startNode: StartNodeComponent as React.ComponentType<any>,
  endNode: EndNodeComponent as React.ComponentType<any>,
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
  onDataUpdate?: (nodes: EditorNode[], edges: EditorEdge[], project: StoryProject | null) => void;
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-bold text-white mb-4">
          Nouveau choix
        </h3>
        <p className="text-gray-300 mb-4">
          Quel est le texte du choix pour aller vers "{targetNodeTitle}" ?
        </p>
        <input
          type="text"
          value={choiceText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChoiceText(e.target.value)}
          placeholder="Ex: Aller à droite"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            type="button"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
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
    
    const [selectedNode, setSelectedNode] = useState<EditorNode | null>(null);
    const [isNodeEditorOpen, setIsNodeEditorOpen] = useState<boolean>(false);
    const [currentProject, setCurrentProject] = useState<StoryProject | null>(null);
    
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

    // Variables globales pour stocker les données de l'éditeur
    const editorDataRef = React.useRef<{
      nodes: EditorNode[];
      edges: EditorEdge[];
      project: StoryProject | null;
    }>({
      nodes: [],
      edges: [],
      project: null
    });

    // Exposer les données via ref avec types stricts
    useImperativeHandle(ref, () => ({
      getNodes: (): EditorNode[] => nodes,
      getEdges: (): EditorEdge[] => edges,
      getCurrentProject: (): StoryProject | null => currentProject,
      updateProject: (project: StoryProject): void => {
        setCurrentProject(project);
        editorDataRef.current.project = project;
      }
    }));

    // Sauvegarder automatiquement dans localStorage avec gestion d'erreurs typée
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
            }
          };
          
          localStorage.setItem('asylum-editor-autosave', JSON.stringify(serializedProject));
          console.log('💾 Auto-sauvegarde effectuée');
        } catch (error: unknown) {
          console.warn('❌ Erreur auto-sauvegarde:', error);
        }
      }
    }, [nodes, edges]);

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

    // Gestionnaire de connexion avec modal - Types stricts
    const onConnect: OnConnect = useCallback(
      (params: Connection) => {
        // Validation stricte des paramètres avec type guards
        if (!params.source || !params.target || typeof params.source !== 'string' || typeof params.target !== 'string') {
          console.warn('Connection invalide: source ou target manquant ou invalide');
          return;
        }
        
        const sourceNode = nodes.find(node => node.id === params.source);
        const targetNode = nodes.find(node => node.id === params.target);
          
        if (!sourceNode || !targetNode) {
          console.warn('Nœuds source ou target non trouvés');
          return;
        }

        // Éviter les auto-connexions
        if (params.source === params.target) {
          console.warn('Auto-connexion interdite');
          return;
        }

        // Ouvrir la modal pour saisir le choix
        setChoiceModal({
          isOpen: true,
          targetNodeTitle: targetNode.data.storyNode.title,
          connectionParams: params,
        });
      },
      [nodes]
    );

    // Fonction pour confirmer le choix depuis la modal avec types stricts
    const handleChoiceConfirm = useCallback((choiceText: string): void => {
      const params = choiceModal.connectionParams;
      if (!params || !params.source || !params.target) return;

      // Créer une nouvelle edge avec le texte saisi - Types stricts
      const newEdge: EditorEdge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'smoothstep',
        data: {
          choice: {
            id: `choice-${Date.now()}`,
            text: choiceText,
            nextNodeId: params.target,
            conditions: [],
            consequences: [],
          }
        },
        label: choiceText,
        labelStyle: { fill: '#ffffff', fontWeight: 600 },
        labelBgStyle: { fill: '#e94560', fillOpacity: 0.8 },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Mettre à jour le nœud source avec le nouveau choix - Types stricts
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === params.source) {
            const newChoice = {
              id: newEdge.data?.choice?.id ?? `choice-${Date.now()}`,
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
                  choices: [...node.data.storyNode.choices, newChoice]
                }
              }
            };
          }
          return node;
        })
      );

      console.log('✅ Connexion créée avec choix:', choiceText);
      
      // Fermer la modal
      setChoiceModal({ isOpen: false, targetNodeTitle: '', connectionParams: null });
    }, [choiceModal, setEdges, setNodes]);

    // Fonction pour annuler la modal
    const handleChoiceCancel = useCallback((): void => {
      setChoiceModal({ isOpen: false, targetNodeTitle: '', connectionParams: null });
    }, []);

    // Créer un nouveau nœud avec validation - Types stricts
    const createNode = useCallback((
      type: 'start' | 'story' | 'end', 
      position = { x: 0, y: 0 }
    ): EditorNode | null => {
      // Vérifier qu'il n'y a qu'un seul nœud de début
      if (type === 'start') {
        const existingStartNodes = nodes.filter(node => node.data.nodeType === 'start');
        if (existingStartNodes.length > 0) {
          alert('Il ne peut y avoir qu\'un seul nœud de début. Supprimez l\'existant d\'abord.');
          return null;
        }
      }

      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const baseStoryNode: StoryNode = {
        id: nodeId,
        title: type === 'start' 
          ? 'Début de l\'histoire' 
          : type === 'end' 
          ? 'Fin de l\'histoire' 
          : 'Nouvelle scène',
        content: type === 'start' 
          ? 'Le début de votre histoire...' 
          : type === 'end' 
          ? 'Fin de l\'histoire.' 
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
        type: type === 'start' ? 'startNode' : type === 'end' ? 'endNode' : 'storyNode',
        position,
        data: {
          storyNode: baseStoryNode,
          nodeType: type,
          isStartNode: type === 'start',
          isEndNode: type === 'end',
        },
        dragHandle: '.drag-handle',
      };

      setNodes((nds) => [...nds, newNode]);
      return newNode;
    }, [setNodes, nodes]);

    // Supprimer un nœud avec nettoyage des edges et choix - Types stricts
    const deleteNode = useCallback((nodeId: string): void => {
      // Supprimer le nœud
      setNodes((nds) => nds.filter(node => node.id !== nodeId));
      
      // Supprimer les edges connectées
      const edgesToRemove = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
      setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
      
      // Mettre à jour les choix des nœuds sources
      edgesToRemove.forEach(edge => {
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
                        choice => choice.nextNodeId !== nodeId
                      )
                    }
                  }
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
    }, [setNodes, setEdges, selectedNode, edges]);

    // Dupliquer un nœud - Types stricts
    const duplicateNode = useCallback((node: EditorNode): EditorNode => {
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
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
          },
        },
      };

      setNodes((nds) => [...nds, newNode]);
      return newNode;
    }, [setNodes]);

    // Gestionnaires d'événements optimisés avec types stricts compatibles React Flow v12
    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node): void => {
      // Type assertion sécurisée pour EditorNode
      const editorNode = node as EditorNode;
      setSelectedNode(editorNode);
    }, []);

    const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node): void => {
      // Type assertion sécurisée pour EditorNode
      const editorNode = node as EditorNode;
      setSelectedNode(editorNode);
      setIsNodeEditorOpen(true);
    }, []);

    // Gestionnaires de changements avec types stricts - CORRIGÉS pour React Flow v12
    const handleNodesChange: OnNodesChange = useCallback(
      (changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds as Node[]) as EditorNode[]);
      },
      [setNodes]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds as any[]) as EditorEdge[]);
      },
      [setEdges]
    );

    // Sauvegarder le nœud édité avec mise à jour des edges - Types stricts
    const saveNodeEdit = useCallback((updatedStoryNode: StoryNode): void => {
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
            const choice = updatedStoryNode.choices.find(c => c.id === edge.sourceHandle);
            if (choice) {
              return {
                ...edge,
                label: choice.text,
                data: {
                  ...edge.data,
                  choice: choice
                }
              };
            }
          }
          return edge;
        })
      );
      
      setIsNodeEditorOpen(false);
    }, [selectedNode, setNodes, setEdges]);

    // Créer un nouveau projet - Types stricts
    const createNewProject = useCallback((): void => {
      const newProject: StoryProject = {
        id: `project-${Date.now()}`,
        name: 'Nouvelle Histoire',
        description: 'Description de votre histoire...',
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

      // Créer le nœud de départ automatiquement
      setTimeout(() => {
        createNode('start', { x: 250, y: 50 });
      }, 100);
    }, [setNodes, setEdges, createNode]);

    // Sauvegarder le projet - Types stricts
    const saveProject = useCallback((): void => {
      if (!currentProject) return;

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
      if (onSave) {
        onSave(updatedProject);
      }
    }, [currentProject, nodes, edges, onSave]);

    // FONCTION DE TEST CORRIGÉE avec types stricts
    const testStory = useCallback((): void => {
      try {
        console.log('🧪 Début du test de l\'histoire...');
        
        // Convertir le graphe React Flow vers le format du jeu
        const conversionResult = GraphToStoryConverter.convert(nodes, edges);

        // Vérifier s'il y a des erreurs critiques
        if (conversionResult.errors.length > 0) {
          const errorMessage = "Impossible de tester l'histoire :\n\n" + 
            conversionResult.errors.join('\n');
          alert(errorMessage);
          return;
        }

        // Afficher les avertissements s'il y en a
        if (conversionResult.warnings.length > 0) {
          const warningMessage = "Avertissements détectés :\n\n" + 
            conversionResult.warnings.join('\n') + 
            "\n\nVoulez-vous continuer le test ?";
          if (!confirm(warningMessage)) {
            return;
          }
        }

        // Générer des statistiques pour le debug
        const stats = GraphToStoryConverter.generateStats(conversionResult);
        console.log('📊 Statistiques de l\'histoire:', stats);

        // Sérialiser l'histoire pour le transport
        const storyData = JSON.stringify({
          story: conversionResult.story,
          startNodeId: conversionResult.startNodeId,
          metadata: {
            generatedAt: new Date().toISOString(),
            editorVersion: '1.0.0',
            totalNodes: stats.totalNodes,
            totalChoices: stats.totalChoices
          }
        });

        // Option A: Nouvelle fenêtre/onglet (recommandé)
        const testUrl = new URL('/', window.location.origin);
        testUrl.searchParams.set('test', 'true');
        testUrl.searchParams.set('story', encodeURIComponent(storyData));
        
        const newWindow = window.open(testUrl.toString(), '_blank');
        
        if (!newWindow) {
          // Fallback si les popups sont bloquées
          alert('Les popups sont bloquées. Copiez ce lien pour tester :\n\n' + testUrl.toString());
          return;
        }

        // Message de succès avec statistiques
        const successMessage = `✅ Test lancé avec succès !\n\n` +
          `📊 Statistiques :\n` +
          `• ${stats.totalNodes} nœuds\n` +
          `• ${stats.totalChoices} choix\n` +
          `• ${stats.averageChoicesPerNode} choix/nœud en moyenne\n` +
          `• Profondeur max: ${stats.maxDepth}\n` +
          `• ${stats.endNodes} fin(s)`;
        
        console.log(successMessage);
        
        // Notification discrète au lieu d'alert
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test d\'histoire lancé', {
            body: `${stats.totalNodes} nœuds, ${stats.totalChoices} choix`,
            icon: '/favicon.ico'
          });
        }

      } catch (error: unknown) {
        console.error('❌ Erreur lors du test:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        alert(`Erreur lors du test de l'histoire :\n\n${errorMessage}`);
      }
    }, [nodes, edges]);

    // Auto-arrangement intelligent des nœuds - Types stricts
    const autoArrange = useCallback((): void => {
      const startNodes = nodes.filter(node => node.data.nodeType === 'start');
      
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
      const positionNodes = (nodeId: string, level: number, position: number): void => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        const x = 100 + position * 300;
        const y = 50 + level * 200;
        positioned.set(nodeId, { x, y });
        
        // Trouver les nœuds enfants
        const childEdges = edges.filter(edge => edge.source === nodeId);
        childEdges.forEach((edge, index) => {
          positionNodes(edge.target, level + 1, position + index);
        });
      };
      
      positionNodes(startNode.id, 0, 0);
      
      // Appliquer les nouvelles positions
      const layoutedNodes = nodes.map(node => ({
        ...node,
        position: positioned.get(node.id) || node.position,
      }));
      
      setNodes(layoutedNodes);
    }, [nodes, edges, setNodes]);

    // Demander permission pour les notifications
    React.useEffect(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }, []);

    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Toolbar */}
        <EditorToolbar
          onCreateNode={createNode}
          onNewProject={createNewProject}
          onSaveProject={saveProject}
          onLoadProject={onLoad || (() => {})} // Valeur par défaut pour éviter undefined
          onExportProject={onExport || (() => {})} // Valeur par défaut pour éviter undefined
          onAutoArrange={autoArrange}
          onTestStory={testStory}
          currentProject={currentProject}
          nodes={memoizedNodes}
          edges={memoizedEdges}
        />

        {/* Main Editor */}
        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 relative">
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
              connectionLineStyle={{ stroke: '#e94560', strokeWidth: 2 }}
              connectionLineType={ConnectionLineType.SmoothStep}
            >
              <Background color="#374151" gap={20} />
              <Controls />
              <MiniMap 
                nodeColor="#e94560"
                maskColor="rgba(0, 0, 0, 0.2)"
                className="bg-gray-700"
              />
              
              {/* Panel d'informations amélioré */}
              <Panel position="top-right" className="bg-gray-800 p-4 rounded-lg text-white max-w-xs">
                <div className="text-sm">
                  <div className="font-medium mb-2">
                    Projet: {currentProject?.name || 'Sans nom'}
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>Nœuds: {nodes.length}</div>
                    <div>Connexions: {edges.length}</div>
                    <div>
                      Début: {nodes.filter(n => n.data.nodeType === 'start').length}
                    </div>
                    <div>
                      Fins: {nodes.filter(n => n.data.nodeType === 'end').length}
                    </div>
                    {selectedNode && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="font-medium text-white">Sélectionné:</div>
                        <div className="text-xs text-gray-300 truncate">
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

        {/* Modal de choix */}
        <ChoiceModal
          isOpen={choiceModal.isOpen}
          targetNodeTitle={choiceModal.targetNodeTitle}
          onConfirm={handleChoiceConfirm}
          onCancel={handleChoiceCancel}
        />
      </div>
    );
  }
);

StoryEditorContent.displayName = 'StoryEditorContent';

export function StoryEditor(props: StoryEditorProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <StoryEditorContent {...props} />
    </ReactFlowProvider>
  );
}

export { StoryEditorContent };