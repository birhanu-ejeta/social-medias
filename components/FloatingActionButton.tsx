'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  className,
  variant = 'primary',
  size = 'lg',
}: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
    accent: 'bg-pink-600 hover:bg-pink-700 shadow-lg hover:shadow-xl text-white',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 flex-col gap-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={label || 'Action Button'}
    >
      <div className={cn('flex items-center justify-center', iconSizeClasses[size])}>
        {icon}
      </div>
      {label && (
        <span className="text-xs font-semibold hidden group-hover:block whitespace-nowrap">
          {label}
        </span>
      )}
    </motion.button>
  );
}
