/**
 * Image Optimization Utilities
 * Provides helpers for responsive images and lazy loading
 */

export interface ImageOptimizationProps {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Generate responsive image srcset for common breakpoints
 */
export function generateSrcSet(basePath: string, format: 'jpg' | 'webp' = 'jpg'): string {
  if (!basePath) return '';
  
  const sizes = [320, 640, 1024, 1440];
  return sizes
    .map((size) => {
      // If using a CDN with width parameter like Vercel Image Optimization
      const url = `${basePath}?w=${size}&q=75&fm=${format}`;
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Get optimal sizes attribute for responsive images
 */
export function getResponsiveSizes(options?: { mobile?: string; tablet?: string; desktop?: string }): string {
  const {
    mobile = '100vw',
    tablet = '100vw',
    desktop = '50vw',
  } = options || {};

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}

/**
 * Calculate aspect ratio padding for responsive containers
 */
export function getAspectRatioPadding(width: number, height: number): number {
  return (height / width) * 100;
}

/**
 * Image placeholder colors for common social media content
 */
export const PLACEHOLDER_COLORS = {
  avatar: 'bg-gradient-to-br from-purple-400 to-purple-600',
  post: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
  cover: 'bg-gradient-to-br from-blue-400 to-purple-600',
  thumbnail: 'bg-gradient-to-br from-pink-300 to-purple-400',
};

/**
 * Get blur data URL for image placeholder (simple version)
 */
export function getBlurDataUrl(color: string = '#f0f0f0'): string {
  // Simple data URL for a single color - in production, generate proper blur hash
  const hex = color.replace('#', '');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect fill='%23${hex}' width='16' height='16'/%3E%3C/svg%3E`;
}

/**
 * Responsive image configuration for different use cases
 */
export const RESPONSIVE_IMAGE_CONFIGS = {
  avatar: {
    sizes: '(max-width: 640px) 48px, (max-width: 1024px) 56px, 64px',
    priority: false,
    aspectRatio: '1/1',
  },
  postMedia: {
    sizes: getResponsiveSizes({ mobile: '100vw', tablet: '100vw', desktop: '100%' }),
    priority: false,
    aspectRatio: 'auto',
  },
  cover: {
    sizes: '100vw',
    priority: true,
    aspectRatio: '16/9',
  },
  thumbnail: {
    sizes: '(max-width: 640px) 100px, (max-width: 1024px) 150px, 200px',
    priority: false,
    aspectRatio: '1/1',
  },
};

/**
 * Intersection Observer options for lazy loading
 */
export const LAZY_LOAD_CONFIG = {
  root: null,
  rootMargin: '50px',
  threshold: 0.01,
};

/**
 * Image loading state utilities
 */
export function createImageLoadingState(imageCount: number) {
  return Array(imageCount)
    .fill(null)
    .map(() => ({ loaded: false, error: false }));
}

export interface ImageMetrics {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  src?: string;
  alt?: string;
}

/**
 * Validate image has proper alt text and accessibility attributes
 */
export function validateImageAccessibility(alt: string, role?: string): boolean {
  // Alt text should not be empty and should be descriptive
  if (!alt || alt.length < 3) return false;
  
  // Avoid repetitive alt text
  if (alt.toLowerCase().includes('image of')) return false;
  
  return true;
}
