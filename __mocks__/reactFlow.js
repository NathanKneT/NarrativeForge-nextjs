// __mocks__/reactFlow.js
module.exports = {
  ReactFlow: ({ children, ...props }) =>
    React.createElement(
      'div',
      { ...props, 'data-testid': 'react-flow' },
      children
    ),
  Background: () =>
    React.createElement('div', { 'data-testid': 'react-flow-background' }),
  Controls: () =>
    React.createElement('div', { 'data-testid': 'react-flow-controls' }),
  MiniMap: () =>
    React.createElement('div', { 'data-testid': 'react-flow-minimap' }),
  Panel: ({ children, ...props }) =>
    React.createElement(
      'div',
      { ...props, 'data-testid': 'react-flow-panel' },
      children
    ),
  Handle: (props) =>
    React.createElement('div', {
      ...props,
      'data-testid': 'react-flow-handle',
    }),
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
  ReactFlowProvider: ({ children }) => children,
};
