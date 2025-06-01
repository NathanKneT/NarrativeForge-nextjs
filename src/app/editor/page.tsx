import dynamic from 'next/dynamic';

// Lazy load de toute la page editor
const EditorPageWrapper = dynamic(
  () => import('@/components/editor/EditorPageWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-48 rounded bg-gray-300"></div>
          <div className="h-4 w-32 rounded bg-gray-300"></div>
        </div>
      </div>
    ),
  }
);

export default function EditorPage() {
  return <EditorPageWrapper />;
}
