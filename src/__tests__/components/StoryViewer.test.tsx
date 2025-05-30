import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryViewer } from '@/components/StoryViewer';
import { createMockStoryNode } from '../utils/test-utils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('StoryViewer', () => {
  const mockOnChoiceSelect = jest.fn();

  beforeEach(() => {
    mockOnChoiceSelect.mockClear();
  });

  it('renders story node with title and content', async () => {
    const node = createMockStoryNode({
      title: 'Test Story Title',
      content: 'This is the story content.',
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    // ✅ FIX: Attendre l'hydration côté client
    await waitFor(() => {
      expect(screen.getByText('Test Story Title')).toBeInTheDocument();
      expect(screen.getByText('This is the story content.')).toBeInTheDocument();
    });
  });

  it('renders choices when available', async () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Go left',
          nextNodeId: 'node-2',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    await waitFor(() => {
      const choiceButton = screen.getByText('Go left');
      expect(choiceButton).toBeInTheDocument();

      fireEvent.click(choiceButton);
      expect(mockOnChoiceSelect).toHaveBeenCalledWith('choice-1');
    });
  });

  it('shows SSR fallback initially', () => {
    const node = createMockStoryNode({
      title: 'Test Story Title',
      content: 'This is the story content.',
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    // ✅ Pendant le SSR, affiche la version simplifiée
    expect(screen.getByText('Test Story Title')).toBeInTheDocument();
  });
});