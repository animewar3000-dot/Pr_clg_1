import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Reveal content as it enters the viewport without replaying on every scroll. */
export function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
