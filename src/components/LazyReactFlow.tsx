'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import React from 'react';

// 🔧 FIX: Skeleton amélioré avec le thème de votre app
const EditorSkeleton = () => (
  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 border-t-transparent mx-auto"></div>
      <p className="mt-4 text-gray-300">Chargement de l'éditeur...</p>
      <p className="mt-2 text-xs text-gray-400">Initialisation des composants React Flow...</p>
    </div>
  </div>
);

// 🔧 FIX: Lazy loading des composants uniquement (pas les hooks)
const ReactFlow = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.ReactFlow })),
  { 
    ssr: false, 
    loading: () => <EditorSkeleton />
  }
);

const Controls = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.Controls })),
  { ssr: false }
);

const Background = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.Background })),
  { ssr: false }
);

const MiniMap = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.MiniMap })),
  { ssr: false }
);

const Panel = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.Panel })),
  { ssr: false }
);

const Handle = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.Handle })),
  { ssr: false }
);

// 🔧 FIX: Export des types et hooks directement (pas de chargement dynamique)
// Les hooks et types doivent être importés statiquement
export type {
  NodeProps,
  Node,
  Edge,
  Connection,
  EdgeProps,
  NodeChange,
  EdgeChange,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';

// 🔧 FIX: Export direct des hooks, enums et utilitaires (pas de dynamic)
export {
  ReactFlowProvider,
  Position, // ✅ CORRIGÉ: Export direct de Position
  ConnectionMode,
  ConnectionLineType,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// 🔧 NEW: Export PositionEnum comme alias pour compatibilité
export { Position as PositionEnum } from '@xyflow/react';

// Export lazy pour les composants seulement
export { ReactFlow, Controls, Background, MiniMap, Panel, Handle };

// 🔧 FIX: Wrapper avec Suspense amélioré
export const LazyReactFlowEditor = ({ children, ...props }: any) => (
  <Suspense fallback={<EditorSkeleton />}>
    <ReactFlow {...props}>
      {children}
    </ReactFlow>
  </Suspense>
);

// 🔧 FIX: Hook personnalisé pour vérifier si React Flow est prêt
export const useReactFlowReady = () => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Vérifier si React Flow est disponible
    import('@xyflow/react')
      .then(() => setIsReady(true))
      .catch((error) => {
        console.error('React Flow non disponible:', error);
        setIsReady(false);
      });
  }, []);
  
  return isReady;
};