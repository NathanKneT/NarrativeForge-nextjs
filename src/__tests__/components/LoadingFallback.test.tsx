import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingFallback from '../../components/LoadingFallback';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('LoadingFallback', () => {
  it('should render loading component', () => {
    render(<LoadingFallback />);

    // ✅ Test basé sur ce qui est réellement rendu
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should have proper CSS classes', () => {
    const { container } = render(<LoadingFallback />);

    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveClass('min-h-screen');
    expect(loadingDiv).toHaveClass('bg-gray-900');
  });

  it('should show spinner', () => {
    const { container } = render(<LoadingFallback />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
