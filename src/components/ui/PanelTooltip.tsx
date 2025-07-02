'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: number;
  showArrow?: boolean;
}

export const ProfessionalTooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'auto',
  delay = 500,
  disabled = false,
  className = '',
  maxWidth = 250,
  showArrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const spacing = 12;
    let finalPosition = position;
    let top = 0;
    let left = 0;

    // Auto-calculate best position if position is 'auto'
    if (position === 'auto') {
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewport.width - triggerRect.right;

      // Choose position with most space
      if (spaceTop > tooltipRect.height + spacing && spaceTop >= spaceBottom) {
        finalPosition = 'top';
      } else if (spaceBottom > tooltipRect.height + spacing) {
        finalPosition = 'bottom';
      } else if (spaceRight > tooltipRect.width + spacing && spaceRight >= spaceLeft) {
        finalPosition = 'right';
      } else {
        finalPosition = 'left';
      }
    }

    // Calculate position based on final position
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(spacing, Math.min(left, viewport.width - tooltipRect.width - spacing));
    top = Math.max(spacing, Math.min(top, viewport.height - tooltipRect.height - spacing));

    setActualPosition(finalPosition as 'top' | 'bottom' | 'left' | 'right');
    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${maxWidth}px`,
      zIndex: 9999,
    });
  }, [position, maxWidth]);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      
      // Recalculate position on scroll/resize
      const handleReposition = () => calculatePosition();
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
      
      return () => {
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isVisible, calculatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    const baseArrow = "absolute w-2 h-2 bg-gray-800 border border-gray-600 transform rotate-45";
    
    switch (actualPosition) {
      case 'top':
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b border-l-transparent border-t-transparent`;
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t border-r-transparent border-b-transparent`;
      case 'left':
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r border-l-transparent border-b-transparent`;
      case 'right':
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l border-r-transparent border-t-transparent`;
      default:
        return baseArrow;
    }
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={tooltipStyle}
          className={`bg-gray-800 border border-gray-600 text-white text-sm rounded-lg shadow-xl px-3 py-2 ${className}`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={hideTooltip}
        >
          {content}
          
          {/* Arrow */}
          {showArrow && (
            <div className={getArrowClasses()} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isMounted && createPortal(tooltipContent, document.body)}
    </>
  );
};

// Preset tooltip variants for common use cases
export const HelpTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => (
  <ProfessionalTooltip 
    content={content} 
    position="top" 
    delay={300}
    className="text-xs"
  >
    {children}
  </ProfessionalTooltip>
);

export const ErrorTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => (
  <ProfessionalTooltip 
    content={
      <div className="flex items-center gap-2 text-red-200">
        <span className="text-red-400">⚠</span>
        {content}
      </div>
    } 
    position="top" 
    delay={200}
    className="bg-red-900 border-red-600"
  >
    {children}
  </ProfessionalTooltip>
);

export const SuccessTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => (
  <ProfessionalTooltip 
    content={
      <div className="flex items-center gap-2 text-green-200">
        <span className="text-green-400">✓</span>
        {content}
      </div>
    } 
    position="top" 
    delay={200}
    className="bg-green-900 border-green-600"
  >
    {children}
  </ProfessionalTooltip>
);