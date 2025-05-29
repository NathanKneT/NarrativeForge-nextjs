const React = require('react');

const MotionDiv = React.forwardRef(
  (
    {
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      ...props
    },
    ref
  ) => React.createElement('div', { ...props, ref }, children)
);
MotionDiv.displayName = 'MotionDiv';

const MotionH1 = React.forwardRef(
  (
    {
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      ...props
    },
    ref
  ) => React.createElement('h1', { ...props, ref }, children)
);
MotionH1.displayName = 'MotionH1';

const MotionButton = React.forwardRef(
  (
    {
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      ...props
    },
    ref
  ) => React.createElement('button', { ...props, ref }, children)
);
MotionButton.displayName = 'MotionButton';

const AnimatePresence = ({ children }) => children;
AnimatePresence.displayName = 'AnimatePresence';

module.exports = {
  motion: {
    div: MotionDiv,
    h1: MotionH1,
    button: MotionButton,
  },
  AnimatePresence,
};
