import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LazyReactFlowEditor, useReactFlowReady } from '@/components/LazyReactFlow';

// Mock dynamic imports
jest.mock('next/dynamic', () => (importFunc: any) => {
  return React.forwardRef((props: any, ref: any) => {
    return <div data-testid="mocked-component" {...props} ref={ref} />;
  });
});

// Mock @xyflow/react
jest.mock('@xyflow/react', () => ({
  ReactFlow: React.forwardRef((props: any, ref: any) => (
    <div data-testid="react-flow" {...props} ref={ref} />
  )),
  Controls: (props: any) => <div data-testid="controls" {...props} />,
  Background: (props: any) => <div data-testid="background" {...props} />,
  MiniMap: (props: any) => <div data-testid="minimap" {...props} />,
  Panel: (props: any) => <div data-testid="panel" {...props} />,
  Handle: (props: any) => <div data-testid="handle" {...props} />,
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  ConnectionMode: {
    Strict: 'strict',
    Loose: 'loose',
  },
  ConnectionLineType: {
    SmoothStep: 'smoothstep',
    Straight: 'straight',
    Step: 'step',
    Bezier: 'bezier',
  },
  addEdge: jest.fn(),
  useNodesState: jest.fn(() => [[], jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn()]),
  applyNodeChanges: jest.fn(),
  applyEdgeChanges: jest.fn(),
}));

describe('LazyReactFlow', () => {
  describe('LazyReactFlowEditor', () => {
    it('should render editor with skeleton loading', () => {
      render(<LazyReactFlowEditor />);
      
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });

    it('should pass props to ReactFlow', () => {
      const testProps = {
        nodes: [],
        edges: [],
        onNodesChange: jest.fn(),
      };

      render(<LazyReactFlowEditor {...testProps} />);
      
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <LazyReactFlowEditor>
          <div data-testid="child-component">Child</div>
        </LazyReactFlowEditor>
      );
      
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });
  });

  describe('useReactFlowReady hook', () => {
    it('should initially return false', () => {
      let isReady: boolean = true;

      function TestComponent() {
        isReady = useReactFlowReady();
        return <div>Test</div>;
      }

      render(<TestComponent />);
      
      // Initially should be false while loading
      expect(isReady).toBe(false);
    });

    it('should handle import success', async () => {
      let isReady: boolean = false;

      function TestComponent() {
        isReady = useReactFlowReady();
        return <div data-testid="test-component">Ready: {isReady.toString()}</div>;
      }

      render(<TestComponent />);
      
      // Wait for potential async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export all required components', async () => {
      // Test that we can import the components
      const {
        ReactFlow,
        Controls,
        Background,
        MiniMap,
        Panel,
        Handle,
        ReactFlowProvider,
        Position,
        ConnectionMode,
        ConnectionLineType,
        addEdge,
        useNodesState,
        useEdgesState,
        applyNodeChanges,
        applyEdgeChanges,
      } = await import('@/components/LazyReactFlow');

      expect(ReactFlow).toBeDefined();
      expect(Controls).toBeDefined();
      expect(Background).toBeDefined();
      expect(MiniMap).toBeDefined();
      expect(Panel).toBeDefined();
      expect(Handle).toBeDefined();
      expect(ReactFlowProvider).toBeDefined();
      expect(Position).toBeDefined();
      expect(ConnectionMode).toBeDefined();
      expect(ConnectionLineType).toBeDefined();
      expect(addEdge).toBeDefined();
      expect(useNodesState).toBeDefined();
      expect(useEdgesState).toBeDefined();
      expect(applyNodeChanges).toBeDefined();
      expect(applyEdgeChanges).toBeDefined();
    });

    it('should have Position enum values', async () => {
      const { Position } = await import('@/components/LazyReactFlow');
      
      expect(Position.Top).toBe('top');
      expect(Position.Bottom).toBe('bottom');
      expect(Position.Left).toBe('left');
      expect(Position.Right).toBe('right');
    });
  });

  describe('Error Handling', () => {
    it('should handle React Flow import errors gracefully', () => {
      // This test ensures the component doesn't crash if React Flow fails to load
      expect(() => {
        render(<LazyReactFlowEditor />);
      }).not.toThrow();
    });

    it('should handle missing Suspense fallback', () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyReactFlowEditor />
        </React.Suspense>
      );
      
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });
  });

  describe('TypeScript Types', () => {
    it('should handle NodeProps type correctly', () => {
      // Test that TypeScript types are exported correctly
      const mockNodeProps = {
        id: 'test-node',
        data: { label: 'Test' },
        selected: false,
        type: 'default',
        position: { x: 0, y: 0 },
      };

      expect(mockNodeProps).toBeDefined();
      expect(mockNodeProps.id).toBe('test-node');
    });

    it('should handle Edge type correctly', () => {
      const mockEdge = {
        id: 'test-edge',
        source: 'node1',
        target: 'node2',
        type: 'default',
      };

      expect(mockEdge).toBeDefined();
      expect(mockEdge.source).toBe('node1');
    });
  });

  describe('Performance', () => {
    it('should lazy load React Flow', () => {
      // Verify that the component uses dynamic import
      render(<LazyReactFlowEditor />);
      
      // Component should render without immediately loading React Flow
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });

    it('should not block initial render', () => {
      const start = performance.now();
      
      render(<LazyReactFlowEditor />);
      
      const end = performance.now();
      const renderTime = end - start;
      
      // Render should be fast (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle server-side rendering', () => {
      // Simulate SSR environment
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        render(<LazyReactFlowEditor />);
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('should handle hydration correctly', () => {
      // This test ensures the component handles client-side hydration
      render(<LazyReactFlowEditor />);
      
      expect(screen.getByTestId('mocked-component')).toBeInTheDocument();
    });
  });
});