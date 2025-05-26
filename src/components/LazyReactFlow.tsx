'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const EditorSkeleton = () => (
  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Chargement de l'éditeur...</p>
    </div>
  </div>
);

// Lazy loading des composants lourds
const ReactFlow = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.ReactFlow })),
  { ssr: false, loading: () => <EditorSkeleton /> }
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

// Export direct pour les types et enums (légers)
export { 
  ReactFlowProvider,
  Position as PositionEnum,
  type NodeProps,
  type Node,
  type Edge 
} from '@xyflow/react';

// Export lazy pour les composants
export { ReactFlow, Controls, Background, MiniMap, Panel, Handle };

// Wrapper avec Suspense
export const LazyReactFlowEditor = ({ children, ...props }: any) => (
  <Suspense fallback={<EditorSkeleton />}>
    <ReactFlow {...props}>
      {children}
    </ReactFlow>
  </Suspense>
);