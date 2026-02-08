'use client';

import React, { useEffect, useRef } from 'react';

interface InfinityScrollLoaderProps {
  onVisible?: () => void;
  threshold?: number;
}

export const InfinityScrollLoader: React.FC<InfinityScrollLoaderProps> = ({
  onVisible,
  threshold = 0.1,
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && onVisible) {
            onVisible();
          }
        });
      },
      {
        threshold,
      }
    );

    observer.observe(loaderRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onVisible, threshold]);

  return (
    <div
      ref={loaderRef}
      className="flex justify-center items-center py-8 w-full"
    >
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
      </div>
    </div>
  );
};