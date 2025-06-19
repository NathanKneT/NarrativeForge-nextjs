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

    expect(screen.getByTitle('Save Game')).toBeInTheDocument(); // Changed from 'Sauvegarder'
    expect(screen.getByTitle('Load Game')).toBeInTheDocument(); // Changed from 'Charger'
    expect(screen.getByTitle('Restart')).toBeInTheDocument(); // Same
    expect(screen.getByTitle('Settings')).toBeInTheDocument(); // Changed from 'Paramètres'
    expect(screen.getByTitle('Mute')).toBeInTheDocument(); // Changed from 'Couper le son'
  });

  it('calls onSave when save button is clicked', () => {
    render(<GameControls {...mockProps} />);

    fireEvent.click(screen.getByTitle('Save Game')); // Changed from 'Sauvegarder'
    expect(mockProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad when load button is clicked', () => {
    render(<GameControls {...mockProps} />);

    fireEvent.click(screen.getByTitle('Load Game')); // Changed from 'Charger'
    expect(mockProps.onLoad).toHaveBeenCalledTimes(1);
  });

  it('calls onRestart when restart button is clicked', () => {
    render(<GameControls {...mockProps} />);

    fireEvent.click(screen.getByTitle('Restart'));
    expect(mockProps.onRestart).toHaveBeenCalledTimes(1);
  });

  it('calls onSettings when settings button is clicked', () => {
    render(<GameControls {...mockProps} />);

    fireEvent.click(screen.getByTitle('Settings')); // Changed from 'Paramètres'
    expect(mockProps.onSettings).toHaveBeenCalledTimes(1);
  });

  it('displays correct mute button title when not muted', () => {
    render(<GameControls {...mockProps} isMuted={false} />);

    expect(screen.getByTitle('Mute')).toBeInTheDocument(); // Changed from 'Couper le son'
  });

  it('displays correct mute button title when muted', () => {
    render(<GameControls {...mockProps} isMuted={true} />);

    expect(screen.getByTitle('Unmute')).toBeInTheDocument(); // Changed from 'Activer le son'
  });

  it('calls onToggleMute when mute button is clicked', () => {
    render(<GameControls {...mockProps} />);

    fireEvent.click(screen.getByTitle('Mute')); // Changed from 'Couper le son'
    expect(mockProps.onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<GameControls {...mockProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('title');
    });
  });

  it('has proper CSS classes for styling', () => {
    render(<GameControls {...mockProps} />);

    const saveButton = screen.getByTitle('Save Game'); // Changed from 'Sauvegarder'
    expect(saveButton).toHaveClass(
      'rounded-lg',
      'bg-gray-700',
      'p-3',
      'text-white'
    ); // Updated classes to match actual component
  });
});