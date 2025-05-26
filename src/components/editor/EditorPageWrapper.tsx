'use client';

import dynamic from 'next/dynamic';

const EditorSkeleton = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-lg text-gray-600">Chargement de l'éditeur de stories...</p>
      <p className="mt-2 text-sm text-gray-500">Préparation des outils d'édition</p>
    </div>
  </div>
);


const StoryEditor = dynamic(
  () => import('../StoryEditor').then(mod => ({ default: mod.StoryEditor })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);

export default function EditorPageWrapper() {
  return <StoryEditor />;
}