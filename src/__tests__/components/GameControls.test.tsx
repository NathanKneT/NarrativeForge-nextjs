// src/__tests__/components/GameControls.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameControls } from '@/components/GameControls';

describe('GameControls', () => {
  const mockProps = {
    onSave: jest.fn(),
    onLoad: jest.fn(),
    onRestart: jest.fn(),
    onSettings: jest.fn(),
    isMuted: false,
    onToggleMute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all control buttons', () => {
    render(<GameControls {...mockProps} />);

    expect(screen.getByTitle('Sauvegarder')).toBeInTheDocument();
    expect(screen.getByTitle('Charger')).toBeInTheDocument();
    expect(screen.getByTitle('Recommencer')).toBeInTheDocument();
    expect(screen.getByTitle('Paramètres')).toBeInTheDocument();
    expect(screen.getByTitle('Couper le son')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    fireEvent.click(screen.getByTitle('Sauvegarder'));
    expect(mockProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad when load button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    fireEvent.click(screen.getByTitle('Charger'));
    expect(mockProps.onLoad).toHaveBeenCalledTimes(1);
  });

  it('calls onRestart when restart button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    fireEvent.click(screen.getByTitle('Recommencer'));
    expect(mockProps.onRestart).toHaveBeenCalledTimes(1);
  });

  it('calls onSettings when settings button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    fireEvent.click(screen.getByTitle('Paramètres'));
    expect(mockProps.onSettings).toHaveBeenCalledTimes(1);
  });

  it('displays correct mute button title when not muted', () => {
    render(<GameControls {...mockProps} isMuted={false} />);
    
    expect(screen.getByTitle('Couper le son')).toBeInTheDocument();
  });

  it('displays correct mute button title when muted', () => {
    render(<GameControls {...mockProps} isMuted={true} />);
    
    expect(screen.getByTitle('Activer le son')).toBeInTheDocument();
  });

  it('calls onToggleMute when mute button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    fireEvent.click(screen.getByTitle('Couper le son'));
    expect(mockProps.onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<GameControls {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('title');
    });
  });

  it('has proper CSS classes for styling', () => {
    render(<GameControls {...mockProps} />);
    
    const saveButton = screen.getByTitle('Sauvegarder');
    expect(saveButton).toHaveClass('p-3', 'bg-asylum-medium', 'hover:bg-asylum-accent');
  });
});