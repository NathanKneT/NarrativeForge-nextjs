import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingFallback from '../../components/LoadingFallback';

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('LoadingFallback', () => {
  it('should render loading skeleton', () => {
    render(<LoadingFallback />);
    
    expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
  });

  it('should display default loading message', () => {
    render(<LoadingFallback />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display custom message when provided', () => {
    const customMessage = 'Loading story editor...';
    render(<LoadingFallback message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should have proper CSS classes for styling', () => {
    render(<LoadingFallback />);
    
    const container = screen.getByTestId('loading-fallback');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should render skeleton elements', () => {
    render(<LoadingFallback showSkeleton />);
    
    expect(screen.getByTestId('skeleton-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-line-2')).toBeInTheDocument();
  });

  it('should handle loading states properly', () => {
    const { rerender } = render(<LoadingFallback isLoading={true} />);
    expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
    
    rerender(<LoadingFallback isLoading={false} />);
    expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
  });
});