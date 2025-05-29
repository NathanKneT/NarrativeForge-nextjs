const React = require('react');

const ReactFlow = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement(
    'div',
    {
      ...props,
      ref,
      'data-testid': 'react-flow',
    },
    children
  )
);
ReactFlow.displayName = 'ReactFlow';

const ReactFlowProvider = ({ children }) => children;
ReactFlowProvider.displayName = 'ReactFlowProvider';

const Background = () =>
  React.createElement('div', { 'data-testid': 'react-flow-background' });
Background.displayName = 'Background';

const Controls = () =>
  React.createElement('div', { 'data-testid': 'react-flow-controls' });
Controls.displayName = 'Controls';

const MiniMap = () =>
  React.createElement('div', { 'data-testid': 'react-flow-minimap' });
MiniMap.displayName = 'MiniMap';

const Panel = ({ children, ...props }) =>
  React.createElement(
    'div',
    {
      ...props,
      'data-testid': 'react-flow-panel',
    },
    children
  );
Panel.displayName = 'Panel';

const Handle = (props) =>
  React.createElement('div', {
    ...props,
    'data-testid': 'react-flow-handle',
  });
Handle.displayName = 'Handle';

module.exports = {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,

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

  useNodesState: jest.fn(() => [[], jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn()]),
  addEdge: jest.fn((newEdge, edges) => [...edges, newEdge]),
  applyNodeChanges: jest.fn((changes, nodes) => nodes),
  applyEdgeChanges: jest.fn((changes, edges) => edges),
};
