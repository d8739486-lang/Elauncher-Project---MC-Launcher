import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  loadCachedImage,
  isImageInMemory,
  createLowResPlaceholder,
} from '../utils/imageCacheService';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain';
  enableBlur?: boolean;
}

/**
 * ProgressiveImage:
 * 1. Shows a low-resolution blurred preview immediately (or memory cache instantly).
 * 2. Lazily and progressively loads the high-resolution image in the background.
 * 3. Smoothly crossfades into the crisp, full-resolution quality once ready.
 * 4. Caches the result in IndexedDB & Memory so revisiting the same mod/datapack
 *    never downloads or re-renders again, keeping RAM light and load time instant.
 */
export function ProgressiveImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc,
  objectFit = 'contain',
  enableBlur = true,
  onError,
  ...rest
}: ProgressiveImageProps) {
  const isAlreadyLoaded = isImageInMemory(src);
  const [currentSrc, setCurrentSrc] = useState<string>(() => (isAlreadyLoaded ? src : ''));
  const [lowResSrc, setLowResSrc] = useState<string>('');
  const [isHighResReady, setIsHighResReady] = useState<boolean>(isAlreadyLoaded);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setCurrentSrc('');
      setIsHighResReady(false);
      return;
    }

    if (isImageInMemory(src)) {
      setCurrentSrc(src);
      setIsHighResReady(true);
      return;
    }

    let isMounted = true;
    setIsHighResReady(false);
    setHasError(false);

    // 1. Generate or fetch low-res tiny placeholder immediately
    createLowResPlaceholder(src).then((placeholder) => {
      if (isMounted && placeholder && !isHighResReady) {
        setLowResSrc(placeholder);
      }
    });

    // 2. Fetch high-res image and cache persistently
    loadCachedImage(src)
      .then((resolvedUrl) => {
        if (isMounted) {
          setCurrentSrc(resolvedUrl);
          setIsHighResReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setIsHighResReady(true);
          } else {
            setHasError(true);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc]);

  if (hasError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${className} object-${objectFit}`}
        {...rest}
      />
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${containerClassName}`}>
      {/* 1. Low-Resolution Instant Placeholder (Blurred for progressive aesthetic) */}
      {!isHighResReady && lowResSrc && (
        <img
          src={lowResSrc}
          alt={alt}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-${objectFit} ${
            enableBlur ? 'filter blur-md scale-105' : ''
          } transition-opacity duration-300 pointer-events-none select-none`}
        />
      )}

      {/* 2. Crisp Full-Resolution Image (Smooth crossfade into view) */}
      <AnimatePresence>
        {isHighResReady && currentSrc && (
          <motion.img
            key={currentSrc}
            src={currentSrc}
            alt={alt}
            initial={{ opacity: isAlreadyLoaded ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            decoding="async"
            className={`${className} object-${objectFit} w-full h-full select-none [image-rendering:-webkit-optimize-contrast]`}
            onError={(e) => {
              if (fallbackSrc && currentSrc !== fallbackSrc) {
                setCurrentSrc(fallbackSrc);
              }
              onError?.(e);
            }}
            {...(rest as any)}
          />
        )}
      </AnimatePresence>

      {/* Subtle loader shimmer if neither placeholder nor full res is ready yet */}
      {!isHighResReady && !lowResSrc && (
        <div className="absolute inset-0 bg-[#12141c]/60 animate-pulse" />
      )}
    </div>
  );
}
