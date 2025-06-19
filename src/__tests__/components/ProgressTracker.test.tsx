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

    // Wait for client-side hydration
    await waitFor(() => {
      expect(screen.getByText('Progress')).toBeInTheDocument(); // Changed from 'Progression'
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('5 / 10 scenes visited')).toBeInTheDocument(); // Changed from 'scènes visitées'
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

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 / 0 scenes visited')).toBeInTheDocument(); // Changed from 'scènes visitées'
    });
  });

  it('handles complete progress', async () => {
    render(
      <ProgressTracker currentProgress={10} totalNodes={10} visitedNodes={10} />
    );

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('10 / 10 scenes visited')).toBeInTheDocument(); // Changed from 'scènes visitées'
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

  it('shows initial render state', () => {
    const { container } = render(
      <ProgressTracker currentProgress={5} totalNodes={10} visitedNodes={5} />
    );

    // Verify component renders
    expect(screen.getByText('Progress')).toBeInTheDocument(); // Changed from 'Progression'

    // Verify basic CSS structure
    expect(container.firstChild).toHaveClass('bg-gray-700');

    // Verify percentage is displayed (regardless of initial value)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument(); // Changed from 'text-red-400'
  });

  it('has proper CSS classes for progress bar', async () => {
    const { container } = render(
      <ProgressTracker currentProgress={5} totalNodes={10} visitedNodes={5} />
    );

    await waitFor(() => {
      const progressBar = container.querySelector('.bg-blue-400'); // Changed from 'bg-red-400'
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('h-2', 'rounded-full');
    });
  });
});