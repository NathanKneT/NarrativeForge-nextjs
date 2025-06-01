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

    expect(screen.getByText('Jouer')).toBeInTheDocument();
    expect(screen.getByText('Éditeur')).toBeInTheDocument();
  });

  it('highlights active link for home page', () => {
    usePathname.mockReturnValue('/');
    render(<Navigation />);

    const homeLink = screen.getByText('Jouer').closest('a');
    expect(homeLink).toHaveClass('bg-blue-600', 'text-white');
  });

  it('highlights active link for editor page', () => {
    usePathname.mockReturnValue('/editor');
    render(<Navigation />);

    const editorLink = screen.getByText('Éditeur').closest('a');
    expect(editorLink).toHaveClass('bg-blue-600', 'text-white');
  });

  it('has correct href attributes', () => {
    render(<Navigation />);

    const homeLink = screen.getByText('Jouer').closest('a');
    const editorLink = screen.getByText('Éditeur').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(editorLink).toHaveAttribute('href', '/editor');
  });

  it('renders with proper navigation structure', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('fixed', 'top-4', 'left-4', 'z-50');
  });
});
