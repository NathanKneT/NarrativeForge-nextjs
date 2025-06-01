'use client';
import dynamic from 'next/dynamic';

const ClientOnlyGame = dynamic(
  () =>
    import('@/components/ClientOnlyGame').then((mod) => ({
      default: mod.ClientOnlyGame,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-asylum-dark">
        <div className="text-xl text-white">Chargement du jeu...</div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <ClientOnlyGame />;
}
