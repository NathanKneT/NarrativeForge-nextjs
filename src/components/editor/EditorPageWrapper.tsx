'use client';

import dynamic from 'next/dynamic';

const EditorSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-purple-600"></div>
      <p className="mt-4 text-lg text-gray-300">
        Loading the editor...
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Preparate tools and resources for your story creation.
      </p>
    </div>
  </div>
);

const StoryEditor = dynamic(
  () => import('../StoryEditor').then((mod) => ({ default: mod.StoryEditor })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

export default function EditorPageWrapper() {
  return <StoryEditor />;
}
