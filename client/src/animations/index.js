/**
 * Premium, minimal Framer Motion animation presets.
 * Designed for subtle transitions, preventing visual distraction.
 */

// Custom cubic bezier for smooth, editorial-feeling eases (similar to Apple/Arc)
export const premiumEase = [0.16, 1, 0.3, 1]; // Custom easeOutExpo
export const gentleSpring = { type: 'spring', stiffness: 380, damping: 35 };

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: 'easeOut' }
};

export const slideUpFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: premiumEase }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

export const micPulse = {
  animate: {
    scale: [1, 1.04, 1],
    opacity: [0.8, 0.4, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const listTransition = {
  layout: {
    transition: { duration: 0.3, ease: premiumEase }
  }
};
