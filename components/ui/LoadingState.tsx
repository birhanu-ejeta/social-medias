'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('skeleton rounded-md', className)}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

interface PostSkeletonProps {
  count?: number;
}

const PostSkeleton: React.FC<PostSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-4 shadow-md">
          {/* Avatar and Header skeleton */}
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Image placeholder skeleton */}
          <div className="mb-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </>
  );
};

interface CardSkeletonProps {
  count?: number;
  lines?: number;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1, lines = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-4 shadow-md">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, j) => (
              <Skeleton key={j} className={`h-4 ${j === lines - 1 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({ size = 'md', count = 1 }) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${sizeClass} rounded-full flex-shrink-0`} />
      ))}
    </>
  );
};

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

const TextSkeleton: React.FC<TextSkeletonProps> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export {
  Skeleton,
  PostSkeleton,
  CardSkeleton,
  AvatarSkeleton,
  TextSkeleton,
};
