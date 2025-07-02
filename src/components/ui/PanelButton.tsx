'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ProfessionalButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
}

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  onClick,
  type = 'button',
  className = '',
  title,
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-blue-500",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500 shadow-md hover:shadow-lg",
    success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25 focus:ring-green-500",
    danger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus:ring-red-500",
    ghost: "text-gray-300 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      type={type}
      title={title}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
      
      {/* Shimmer effect for primary/success/danger variants */}
      {(variant === 'primary' || variant === 'success' || variant === 'danger') && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
      )}
      
      {/* Content */}
      <div className="relative flex items-center gap-2">
        {loading ? (
          <div className={`animate-spin rounded-full border-2 border-white border-t-transparent w-${iconSizes[size] / 4} h-${iconSizes[size] / 4}`}>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />
        )}
        
        <span>{children}</span>
        
        {!loading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
      </div>
    </motion.button>
  );
};