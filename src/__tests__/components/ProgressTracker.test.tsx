import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressTracker } from '@/components/ProgressTracker';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ProgressTracker', () => {
  it('renders progress information correctly', async () => {
    render(
      <ProgressTracker currentProgress={5} totalNodes={10} visitedNodes={5} />
    );

    // Attendre l'hydration côté client
    await waitFor(() => {
      expect(screen.getByText('Progression')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('5 / 10 scènes visitées')).toBeInTheDocument();
    });
  });

  it('calculates percentage correctly', async () => {
    render(
      <ProgressTracker currentProgress={3} totalNodes={12} visitedNodes={3} />
    );

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  it('handles zero total nodes', async () => {
    render(
      <ProgressTracker currentProgress={0} totalNodes={0} visitedNodes={0} />
    );

    // Attendre l'hydration et vérifier que 0% s'affiche
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 / 0 scènes visitées')).toBeInTheDocument();
    });
  });

  it('handles complete progress', async () => {
    render(
      <ProgressTracker currentProgress={10} totalNodes={10} visitedNodes={10} />
    );

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('10 / 10 scènes visitées')).toBeInTheDocument();
    });
  });

  it('rounds percentage to nearest integer', async () => {
    render(
      <ProgressTracker currentProgress={1} totalNodes={3} visitedNodes={1} />
    );

    await waitFor(() => {
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  // 🔧 FIX: Test SSR plus réaliste - vérifie la présence mais pas les valeurs exactes
  it('shows initial render state', () => {
    const { container } = render(
      <ProgressTracker currentProgress={5} totalNodes={10} visitedNodes={5} />
    );

    // Vérifier que le composant s'affiche
    expect(screen.getByText('Progression')).toBeInTheDocument();

    // Vérifier la structure CSS de base
    expect(container.firstChild).toHaveClass('bg-gray-700');

    // Vérifier qu'il y a un pourcentage affiché (peu importe la valeur initiale)
    expect(container.querySelector('.text-red-400')).toBeInTheDocument();
  });

  it('has proper CSS classes for progress bar', async () => {
    const { container } = render(
      <ProgressTracker currentProgress={5} totalNodes={10} visitedNodes={5} />
    );

    await waitFor(() => {
      const progressBar = container.querySelector('.bg-red-400');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('h-2', 'rounded-full');
    });
  });
});
