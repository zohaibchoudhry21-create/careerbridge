import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const AvatarGroupContext = React.createContext(null);
const AvatarItemContext = React.createContext(null);

function AvatarGroup({
  children,
  className,
  invertOverlap = false,
  translate = '-30%',
  transition = { type: 'spring', stiffness: 300, damping: 17 },
  side = 'top',
  sideOffset = 25,
  style,
  ...props
}) {
  const items = React.Children.toArray(children);

  return (
    <AvatarGroupContext.Provider value={{ translate, transition, side, sideOffset }}>
      <div
        data-slot="avatar-group"
        className={cn('flex items-center', className)}
        style={{ display: 'flex', alignItems: 'center', ...style }}
        {...props}
      >
        {items.map((child, index) => (
          <AvatarContainer
            key={child.key ?? index}
            zIndex={invertOverlap ? items.length - index : index + 1}
          >
            {child}
          </AvatarContainer>
        ))}
      </div>
    </AvatarGroupContext.Provider>
  );
}

function AvatarContainer({ children, zIndex }) {
  const group = React.useContext(AvatarGroupContext);
  const [open, setOpen] = React.useState(false);
  const [tooltipNode, setTooltipNode] = React.useState(null);

  return (
    <AvatarItemContext.Provider value={{ setTooltipNode }}>
      <motion.div
        data-slot="avatar-container"
        className="relative"
        style={{ zIndex }}
        initial="initial"
        whileHover="hover"
        whileTap="hover"
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <motion.div
          variants={{
            initial: { y: 0 },
            hover: { y: group?.translate ?? '-30%' },
          }}
          transition={group?.transition}
        >
          {children}
        </motion.div>

        <AnimatePresence>
          {open && tooltipNode ? (
            <motion.div
              className={cn(
                'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2',
                group?.side === 'bottom' ? 'top-full' : 'bottom-full',
              )}
              style={{
                marginBottom: group?.side === 'top' ? group?.sideOffset : undefined,
                marginTop: group?.side === 'bottom' ? group?.sideOffset : undefined,
              }}
              initial={{ opacity: 0, scale: 0.9, y: group?.side === 'bottom' ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: group?.side === 'bottom' ? -6 : 6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {tooltipNode}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </AvatarItemContext.Provider>
  );
}

function AvatarGroupTooltip({ className, children }) {
  const item = React.useContext(AvatarItemContext);

  React.useEffect(() => {
    if (!item?.setTooltipNode) return undefined;

    item.setTooltipNode(
      <div
        className={cn(
          'relative whitespace-nowrap rounded-md bg-primary-container px-3 py-1.5 text-xs text-balance text-on-primary shadow-md',
          className,
        )}
      >
        {children}
        <span
          className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-primary-container"
          aria-hidden
        />
      </div>,
    );

    return () => item.setTooltipNode(null);
  }, [item, children, className]);

  return null;
}

function AvatarGroupTooltipArrow() {
  return null;
}

export { AvatarGroup, AvatarGroupTooltip, AvatarGroupTooltipArrow };
