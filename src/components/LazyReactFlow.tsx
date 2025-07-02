'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import React from 'react';

const EditorSkeleton = () => (
  <div className="flex h-full w-full items-center justify-center bg-gray-800">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-300">Chargement de l'éditeur...</p>
      <p className="mt-2 text-xs text-gray-400">
        Initialisation des composants React Flow...
      </p>
    </div>
  </div>
);

const ReactFlow = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.ReactFlow })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

const Controls = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.Controls })),
  { ssr: false }
);

const Background = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.Background })),
  { ssr: false }
);

const MiniMap = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.MiniMap })),
  { ssr: false }
);

const Panel = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.Panel })),
  { ssr: false }
);

const Handle = dynamic(
  () => import('@xyflow/react').then((mod) => ({ default: mod.Handle })),
  { ssr: false }
);

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

export {
  ReactFlowProvider,
  Position,
  ConnectionMode,
  ConnectionLineType,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

export { Position as PositionEnum } from '@xyflow/react';

export { ReactFlow, Controls, Background, MiniMap, Panel, Handle };

export const LazyReactFlowEditor = ({ children, ...props }: any) => (
  <Suspense fallback={<EditorSkeleton />}>
    <ReactFlow {...props}>{children}</ReactFlow>
  </Suspense>
);

export const useReactFlowReady = () => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    import('@xyflow/react')
      .then(() => setIsReady(true))
      .catch((error) => {
        console.error('React Flow non disponible:', error);
        setIsReady(false);
      });
  }, []);

  return isReady;
};
