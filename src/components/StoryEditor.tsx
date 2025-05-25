'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Connection,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { EditorNode, EditorEdge, StoryProject } from '@/types/editor';
import { StoryNode } from '@/types/story';
import { EditorToolbar } from './editor/EditorToolbar';
import { NodeEditor } from './editor/NodeEditor';
import { StoryNodeComponent } from './editor/StoryNodeComponent';
import { StartNodeComponent } from './editor/StartNodeComponent';
import { EndNodeComponent } from './editor/EndNodeComponent';
import { GraphToStoryConverter } from '@/lib/graphToStoryConverter';

// Types de nœuds personnalisés
const nodeTypes = {
  storyNode: StoryNodeComponent,
  startNode: StartNodeComponent,
  endNode: EndNodeComponent,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#e94560', strokeWidth: 2 },
};

interface StoryEditorProps {
  onSave?: (project: StoryProject) => void;
  onLoad?: () => void;
  onExport?: (format: string) => void;
}

function StoryEditorContent({ onSave, onLoad, onExport }: StoryEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedNode, setSelectedNode] = useState<EditorNode | null>(null);
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<StoryProject | null>(null);

  // Mémorisation pour optimiser les performances
  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedEdges = useMemo(() => edges, [edges]);

  // Gestionnaire de connexion des nœuds optimisé
  const onConnect = useCallback(
    (params: Connection) => {
      // Vérification de sécurité
      if (!params.source || !params.target) {
        console.warn('Connection invalide: source ou target manquant');
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

      // Créer une nouvelle edge avec validation
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
            text: 'Nouveau choix',
            nextNodeId: params.target,
            conditions: [],
            consequences: [],
          }
        },
        label: 'Nouveau choix',
        labelStyle: { fill: '#ffffff', fontWeight: 600 },
        labelBgStyle: { fill: '#e94560', fillOpacity: 0.8 },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  // Créer un nouveau nœud avec validation
  const createNode = useCallback((type: 'start' | 'story' | 'end', position = { x: 0, y: 0 }) => {
    // Vérifier qu'il n'y a qu'un seul nœud de début
    if (type === 'start') {
      const existingStartNodes = nodes.filter(node => 
        (node as EditorNode).data.nodeType === 'start'
      );
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

  // Supprimer un nœud avec nettoyage des edges
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setIsNodeEditorOpen(false);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Dupliquer un nœud
  const duplicateNode = useCallback((node: EditorNode) => {
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

  // Gestionnaires d'événements optimisés
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const editorNode = node as EditorNode;
    setSelectedNode(editorNode);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const editorNode = node as EditorNode;
    setSelectedNode(editorNode);
    setIsNodeEditorOpen(true);
  }, []);

  // Sauvegarder le nœud édité
  const saveNodeEdit = useCallback((updatedStoryNode: StoryNode) => {
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
    
    setIsNodeEditorOpen(false);
  }, [selectedNode, setNodes]);

  // Créer un nouveau projet
  const createNewProject = useCallback(() => {
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

  // Sauvegarder le projet
  const saveProject = useCallback(() => {
    if (!currentProject) return;

    const updatedProject: StoryProject = {
      ...currentProject,
      nodes: nodes as EditorNode[],
      edges: edges as EditorEdge[],
      metadata: {
        ...currentProject.metadata,
        updatedAt: new Date(),
      },
    };

    setCurrentProject(updatedProject);
    onSave?.(updatedProject);
  }, [currentProject, nodes, edges, onSave]);

  // FONCTION DE TEST CORRIGÉE
  const testStory = useCallback(() => {
    try {
      console.log('🧪 Début du test de l\'histoire...');
      
      // Convertir le graphe React Flow vers le format du jeu
      const conversionResult = GraphToStoryConverter.convert(
        nodes as EditorNode[], 
        edges as EditorEdge[]
      );

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

    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      alert(`Erreur lors du test de l'histoire :\n\n${error}`);
    }
  }, [nodes, edges]);

  // Auto-arrangement intelligent des nœuds
  const autoArrange = useCallback(() => {
    const startNodes = nodes.filter(node => 
      (node as EditorNode).data.nodeType === 'start'
    );
    
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
    
    // Positionnement récursif en largeur d'abord
    const positionNodes = (nodeId: string, level: number, position: number) => {
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

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <EditorToolbar
        onCreateNode={createNode}
        onNewProject={createNewProject}
        onSaveProject={saveProject}
        onLoadProject={onLoad}
        onExportProject={onExport}
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
            nodes={memoizedNodes}
            edges={memoizedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
            connectionLineType="smoothstep"
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
                    Début: {nodes.filter(n => (n as EditorNode).data.nodeType === 'start').length}
                  </div>
                  <div>
                    Fins: {nodes.filter(n => (n as EditorNode).data.nodeType === 'end').length}
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
    </div>
  );
}

export function StoryEditor(props: StoryEditorProps) {
  return (
    <ReactFlowProvider>
      <StoryEditorContent {...props} />
    </ReactFlowProvider>
  );
}