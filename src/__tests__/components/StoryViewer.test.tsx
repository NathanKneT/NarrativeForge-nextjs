import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { StoryViewer } from '@/components/StoryViewer';
import { createMockStoryNode } from '../utils/test-utils';

// Mock framer-motion pour éviter les problèmes d'animation dans les tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => 
      React.createElement('div', props, children),
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => 
      React.createElement('h1', props, children),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => 
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('StoryViewer', () => {
  const mockOnChoiceSelect = jest.fn<void, [string]>();
  
  beforeEach(() => {
    mockOnChoiceSelect.mockClear();
  });

  it('renders story node with title and content', () => {
    const node = createMockStoryNode({
      title: 'Test Story Title',
      content: 'This is the story content.',
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    expect(screen.getByText('Test Story Title')).toBeInTheDocument();
    expect(screen.getByText('This is the story content.')).toBeInTheDocument();
  });

  it('renders all available choices', () => {
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

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    expect(screen.getByText('Go left')).toBeInTheDocument();
    expect(screen.getByText('Go right')).toBeInTheDocument();
  });

  it('calls onChoiceSelect when a choice is clicked', async () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Make this choice',
          nextNodeId: 'node-2',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    const choiceButton = screen.getByText('Make this choice');
    fireEvent.click(choiceButton);

    await waitFor(() => {
      expect(mockOnChoiceSelect).toHaveBeenCalledWith('choice-1');
    });
  });

  it('handles HTML content correctly', () => {
    const node = createMockStoryNode({
      content: '<p>This is <strong>bold</strong> text.</p>',
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders without choices (end node)', () => {
    const node = createMockStoryNode({
      title: 'The End',
      content: 'You have reached the end of the story.',
      choices: [],
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    expect(screen.getByText('The End')).toBeInTheDocument();
    expect(screen.getByText('You have reached the end of the story.')).toBeInTheDocument();
    
    // Pas de boutons de choix
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('handles multiple rapid clicks gracefully', async () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Click me',
          nextNodeId: 'node-2',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    const choiceButton = screen.getByText('Click me');
    
    // Cliquer rapidement plusieurs fois
    fireEvent.click(choiceButton);
    fireEvent.click(choiceButton);
    fireEvent.click(choiceButton);

    await waitFor(() => {
      // Devrait être appelé au moins une fois
      expect(mockOnChoiceSelect).toHaveBeenCalled();
    });
  });

  it('applies correct CSS classes for styling', () => {
    const node = createMockStoryNode();

    const { container } = render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('max-w-4xl', 'mx-auto', 'p-6');
  });

  it('renders accessibility attributes', () => {
    const node = createMockStoryNode({
      choices: [
        {
          id: 'choice-1',
          text: 'Accessible choice',
          nextNodeId: 'node-2',
          conditions: [],
          consequences: [],
        },
      ],
    });

    render(
      <StoryViewer 
        node={node} 
        onChoiceSelect={mockOnChoiceSelect} 
      />
    );

    const choiceButton = screen.getByRole('button', { name: 'Accessible choice' });
    expect(choiceButton).toBeInTheDocument();
  });
});