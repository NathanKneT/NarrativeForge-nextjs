import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryViewer } from '@/components/StoryViewer';
import { createMockStoryNode } from '../utils/test-utils';

// Mock framer-motion - supprime toutes les props d'animation
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      ...props
    }: any) => <div {...props}>{children}</div>,
    h1: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      ...props
    }: any) => <h1 {...props}>{children}</h1>,
    button: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      ...props
    }: any) => <button {...props}>{children}</button>,
    p: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      ...props
    }: any) => <p {...props}>{children}</p>,
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
      expect(
        screen.getByText('This is the story content.')
      ).toBeInTheDocument();
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

  it('handles multiple choices correctly', async () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Go left',
          nextNodeId: 'node-2',
          conditions: [],
          consequences: [],
        },
        {
          id: 'choice-2',
          text: 'Go right',
          nextNodeId: 'node-3',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Go left')).toBeInTheDocument();
      expect(screen.getByText('Go right')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Go right'));
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('choice-2');
  });

  it('renders without choices', async () => {
    const node = createMockStoryNode({
      title: 'End Node',
      content: 'The story ends here.',
      choices: [],
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    await waitFor(() => {
      expect(screen.getByText('End Node')).toBeInTheDocument();
      expect(screen.getByText('The story ends here.')).toBeInTheDocument();
    });

    // No buttons should be present
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
