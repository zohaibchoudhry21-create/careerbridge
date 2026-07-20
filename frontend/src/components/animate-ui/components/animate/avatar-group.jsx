import * as React from 'react';
import {
  AvatarGroup as AvatarGroupPrimitive,
  AvatarGroupTooltip as AvatarGroupTooltipPrimitive,
} from '@/components/animate-ui/primitives/animate/avatar-group';
import { cn } from '@/lib/utils';

function AvatarGroup({ className, invertOverlap = true, ...props }) {
  return (
    <AvatarGroupPrimitive
      className={cn('h-12 -space-x-3', className)}
      invertOverlap={invertOverlap}
      {...props}
    />
  );
}

function AvatarGroupTooltip({ className, children, ...props }) {
  return (
    <AvatarGroupTooltipPrimitive
      className={cn(
        'bg-primary-container text-on-primary z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance',
        className,
      )}
      {...props}
    >
      {children}
    </AvatarGroupTooltipPrimitive>
  );
}

export { AvatarGroup, AvatarGroupTooltip };
