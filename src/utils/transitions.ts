import { Transition, Variants } from 'framer-motion';

// Smooth easing curves similar to Figma's Smart Animate
export const easing = {
  // Smooth deceleration curve (default)
  smooth: [0.25, 0.46, 0.45, 0.94],
  // Bouncy spring-like curve
  spring: [0.68, -0.55, 0.265, 1.55],
  // Sharp acceleration/deceleration
  sharp: [0.4, 0.0, 0.2, 1],
  // Gentle ease in and out
  gentle: [0.42, 0, 0.58, 1],
} as const;

// Screen transition configurations
export const screenTransition: Transition = {
  duration: 0.45,
  ease: easing.smooth,
};

// Quick transitions for subtle animations
export const quickTransition: Transition = {
  duration: 0.25,
  ease: easing.gentle,
};

// Spring transition for playful animations
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Shared layout transition
export const layoutTransition: Transition = {
  duration: 0.4,
  ease: easing.smooth,
  layout: {
    duration: 0.4,
    ease: easing.smooth,
  },
};

// Page variants with slide and fade effects
export const pageVariants: Variants = {
  initial: (direction: 'forward' | 'backward' = 'forward') => ({
    opacity: 0,
    x: direction === 'forward' ? 40 : -40,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction: 'forward' | 'backward' = 'forward') => ({
    opacity: 0,
    x: direction === 'forward' ? -40 : 40,
    scale: 0.98,
  }),
};

// Card variants with scale and opacity
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.96,
  },
};

// Staggered children animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

// Shared element animation for images
export const imageVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 1.05,
  },
};

// Fade through variants (fade out then fade in)
export const fadeThroughVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 1.05,
  },
};
