import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS with custom settings
export const initializeAnimations = () => {
  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: true,
    mirror: false,
    anchorPlacement: 'top-bottom',
    offset: 120,
    delay: 0,
  });
};

// Refresh AOS when content changes
export const refreshAnimations = () => {
  AOS.refresh();
};

// Custom animation variants for Framer Motion
export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 60,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const fadeInLeft = {
  hidden: { 
    opacity: 0, 
    x: -60,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const fadeInRight = {
  hidden: { 
    opacity: 0, 
    x: 60,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const scaleIn = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

export const slideInFromTop = {
  hidden: { 
    opacity: 0, 
    y: -60,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const slideInFromBottom = {
  hidden: { 
    opacity: 0, 
    y: 60,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const rotateIn = {
  hidden: { 
    opacity: 0, 
    rotate: -180,
    scale: 0.5,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    rotate: 0,
    scale: 1,
    transition: { 
      duration: 1,
      ease: "easeOut"
    }
  }
};

export const bounceIn = {
  hidden: { 
    opacity: 0, 
    scale: 0.3,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.8,
      type: "spring",
      damping: 10,
      stiffness: 100
    }
  }
};

// Hover animations
export const cardHover = {
  rest: { 
    scale: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: { 
    scale: 1.05, 
    y: -10,
    transition: { 
      duration: 0.3, 
      ease: "easeOut",
      type: "spring",
      stiffness: 300
    }
  }
};

export const buttonHover = {
  rest: { 
    scale: 1,
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.1,
    transition: { 
      duration: 0.2,
      type: "spring",
      stiffness: 400
    }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

export const scaleHover = {
  rest: { 
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: { 
    scale: 1.05,
    transition: { 
      duration: 0.3,
      type: "spring",
      stiffness: 300
    }
  }
};

export const iconSpin = {
  rest: { 
    rotate: 0,
    transition: { duration: 0.5 }
  },
  hover: { 
    rotate: 360,
    transition: { 
      duration: 0.8,
      ease: "easeInOut"
    }
  }
};

// Loading animations
export const pulseAnimation = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const spinAnimation = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Text animations
export const typewriterAnimation = {
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: {
      duration: 2,
      ease: "easeInOut"
    }
  }
};

export const letterAnimation = {
  hidden: { 
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Page transition animations
export const pageTransition = {
  hidden: { 
    opacity: 0,
    x: -200,
    transition: { duration: 0.5 }
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: 200,
    transition: { 
      duration: 0.5,
      ease: "easeIn"
    }
  }
};

// Performance optimized animations for mobile
export const reduceMotionVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

// Check if user prefers reduced motion
export const respectsReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get appropriate animation variant based on user preference
export const getAnimationVariant = (normalVariant, reducedVariant = reduceMotionVariants) => {
  return respectsReducedMotion() ? reducedVariant : normalVariant;
};
