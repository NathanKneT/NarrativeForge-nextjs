import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/Navigation';

// Mock Next.js usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const { usePathname } = require('next/navigation');

describe('Navigation', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/');
  });

  it('renders navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('Stories')).toBeInTheDocument(); // Changed from 'Jouer'
    expect(screen.getByText('Editor')).toBeInTheDocument(); // Changed from 'Éditeur'
  });

  it('highlights active link for home page', () => {
    usePathname.mockReturnValue('/');
    render(<Navigation />);

    const homeLink = screen.getByText('Stories').closest('a'); // Changed from 'Jouer'
    expect(homeLink).toHaveClass('bg-blue-600', 'text-white');
  });

  it('highlights active link for editor page', () => {
    usePathname.mockReturnValue('/editor');
    render(<Navigation />);

    const editorLink = screen.getByText('Editor').closest('a'); // Changed from 'Éditeur'
    expect(editorLink).toHaveClass('bg-blue-600', 'text-white');
  });

  it('has correct href attributes', () => {
    render(<Navigation />);

    const homeLink = screen.getByText('Stories').closest('a'); // Changed from 'Jouer'
    const editorLink = screen.getByText('Editor').closest('a'); // Changed from 'Éditeur'

    expect(homeLink).toHaveAttribute('href', '/');
    expect(editorLink).toHaveAttribute('href', '/editor');
  });

  it('renders with proper navigation structure', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('fixed', 'left-4', 'top-4', 'z-50'); // Updated classes
  });
});