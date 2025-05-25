'use client';
import dynamic from 'next/dynamic';

const ClientOnlyGame = dynamic(
  () => import('@/components/ClientOnlyGame').then(mod => ({ default: mod.ClientOnlyGame })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-asylum-dark flex items-center justify-center">
        <div className="text-white text-xl">Chargement du jeu...</div>
      </div>
    )
  }
);

export default function HomePage() {
  return <ClientOnlyGame />;
}