import dynamic from 'next/dynamic';

// Lazy load de toute la page editor
const EditorPageWrapper = dynamic(
  () => import('@/components/editor/EditorPageWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    )
  }
);

export default function EditorPage() {
  return <EditorPageWrapper />;
}