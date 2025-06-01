import { render, screen } from '@testing-library/react';

// Basic smoke test to ensure testing setup works
describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    expect(result).toBe('async result');
  });
});

// Test environment validation
describe('Environment Setup', () => {
  it('should have jest globals available', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have testing library matchers', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div).toBeInTheDocument();
  });
});

export {};
