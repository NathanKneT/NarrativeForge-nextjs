import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryViewer } from '../../components/StoryViewer';
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

  it('renders story node with title and content', () => {
    const node = createMockStoryNode({
      title: 'Test Story Title',
      content: 'This is the story content.',
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    expect(screen.getByText('Test Story Title')).toBeInTheDocument();
    expect(screen.getByText('This is the story content.')).toBeInTheDocument();
  });

  it('renders choices when available', () => {
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

    const choiceButton = screen.getByText('Go left');
    expect(choiceButton).toBeInTheDocument();

    fireEvent.click(choiceButton);
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('choice-1');
  });

  it('renders without choices (end node)', () => {
    const node = createMockStoryNode({
      title: 'The End',
      content: 'You have reached the end.',
      choices: [],
    });

    render(<StoryViewer node={node} onChoiceSelect={mockOnChoiceSelect} />);

    expect(screen.getByText('The End')).toBeInTheDocument();
    expect(screen.getByText('You have reached the end.')).toBeInTheDocument();

    // Pas de boutons de choix
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});
