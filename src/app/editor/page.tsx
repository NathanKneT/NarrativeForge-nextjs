import dynamic from 'next/dynamic';

const EditorPageWrapper = dynamic(
  () => import('@/components/editor/EditorPageWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="text-center space-y-6">
          {/* Professional multi-ring spinner */}
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-3 border-transparent border-t-green-400 animate-spin" style={{ animationDelay: '150ms', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full border border-transparent border-t-pink-400 animate-spin" style={{ animationDelay: '300ms', animationDuration: '2s' }}></div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">
              Loading Story Editor
            </h3>
            <p className="text-gray-400">
              Preparing your AI-powered creative workspace...
            </p>
            
            {/* Feature loading indicators */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2 text-blue-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Visual node editor</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-purple-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <span>AI content generation</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <span>Professional tools</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-80 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export default function EditorPage() {
  return <EditorPageWrapper />;
}