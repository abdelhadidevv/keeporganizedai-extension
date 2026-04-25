import * as React from 'react';
/* eslint-disable react/jsx-props-no-spreading */
import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/10',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        'before:animate-[skeleton_1.5s_ease-in-out_infinite]',
        'dark:before:via-gray-700/40',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
