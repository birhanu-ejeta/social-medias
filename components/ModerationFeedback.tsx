'use client';

import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ModerationFeedbackProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  categories?: string[];
  toxicityScore?: number;
  onDismiss?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

export function ModerationFeedback({
  type,
  title,
  message,
  categories,
  toxicityScore,
  onDismiss,
  onLearnMore,
  className,
}: ModerationFeedbackProps) {
  const typeStyles = {
    error: 'border-red-500/30 bg-red-50 dark:bg-red-950/20',
    warning: 'border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20',
    info: 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/20',
  };

  const titleStyles = {
    error: 'text-red-900 dark:text-red-200',
    warning: 'text-yellow-900 dark:text-yellow-200',
    info: 'text-blue-900 dark:text-blue-200',
  };

  const messageStyles = {
    error: 'text-red-800 dark:text-red-300',
    warning: 'text-yellow-800 dark:text-yellow-300',
    info: 'text-blue-800 dark:text-blue-300',
  };

  const iconStyles = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  const IconComponent = type === 'error' || type === 'warning' ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        'border rounded-lg p-4 animate-slideInDown',
        typeStyles[type],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
        
        <div className="flex-1">
          <h3 className={cn('font-semibold text-sm mb-1', titleStyles[type])}>
            {title}
          </h3>
          <p className={cn('text-sm mb-3', messageStyles[type])}>
            {message}
          </p>

          {/* Detected Categories */}
          {categories && categories.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1 opacity-75">Detected:</p>
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <span
                    key={category}
                    className={cn(
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      type === 'error'
                        ? 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        : 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                    )}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toxicity Score */}
          {toxicityScore !== undefined && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1 opacity-75">
                Toxicity Score: {(toxicityScore * 100).toFixed(1)}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    toxicityScore > 0.7
                      ? 'bg-red-600'
                      : toxicityScore > 0.4
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  )}
                  style={{ width: `${toxicityScore * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {onLearnMore && (
              <Button
                size="sm"
                variant="outline"
                onClick={onLearnMore}
                className="text-xs"
              >
                Learn More
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
