// Micro-animations utility for enhanced user interactions
// Includes button ripples, cursor effects, loading spinners, toast notifications

import React from 'react';
import { motion } from 'framer-motion';

// Button Ripple Effect Component
export const RippleButton = ({ children, onClick, className = '', ...props }) => {
  const handleClick = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);

    if (onClick) onClick(e);
  };

  return (
    <motion.button
      className={`ripple-button ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Loading Spinner Variants
export const spinnerVariants = {
  rotate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  bounce: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Spinner Component
export const LoadingSpinner = ({ type = 'rotate', size = 24, color = '#3b82f6' }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    border: `2px solid transparent`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%'
  };

  return (
    <motion.div
      className="loading-spinner"
      style={spinnerStyle}
      variants={spinnerVariants}
      animate={type}
    />
  );
};

// Toast Notification Variants
export const toastVariants = {
  hidden: {
    opacity: 0,
    y: -100,
    scale: 0.3
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    y: -100,
    scale: 0.5,
    transition: {
      duration: 0.2
    }
  }
};

// Toast Component
export const Toast = ({ message, type = 'info', onClose }) => {
  const toastStyles = {
    info: { backgroundColor: '#3b82f6', color: 'white' },
    success: { backgroundColor: '#10b981', color: 'white' },
    error: { backgroundColor: '#ef4444', color: 'white' },
    warning: { backgroundColor: '#f59e0b', color: 'white' }
  };

  return (
    <motion.div
      className={`toast toast-${type}`}
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={toastStyles[type]}
      onClick={onClose}
    >
      <span className="toast-message">{message}</span>
      <motion.button
        className="toast-close"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
      >
        ×
      </motion.button>
    </motion.div>
  );
};

// Cursor Follow Effect (for interactive elements)
export const useCursorFollow = () => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
};

// Floating Action Button with micro-interactions
export const FloatingActionButton = ({ icon, onClick, tooltip }) => {
  return (
    <motion.div
      className="floating-action-button"
      whileHover={{ 
        scale: 1.1,
        boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      title={tooltip}
    >
      <motion.div
        className="fab-icon"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
    </motion.div>
  );
};

// Progress Bar with animation
export const AnimatedProgressBar = ({ progress, color = '#3b82f6' }) => {
  return (
    <div className="progress-container">
      <motion.div
        className="progress-bar"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// Card Flip Animation
export const FlipCard = ({ front, back, className = '' }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <motion.div
      className={`flip-card ${className}`}
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className="flip-card-inner"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="flip-card-front">{front}</div>
        <div className="flip-card-back">{back}</div>
      </motion.div>
    </motion.div>
  );
};

// Parallax Scroll Effect
export const ParallaxElement = ({ children, speed = 0.5, direction = 'vertical' }) => {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setOffset(scrollTop * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const transform = direction === 'vertical' 
    ? `translateY(${offset}px)` 
    : `translateX(${offset}px)`;

  return (
    <motion.div
      style={{ transform }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

// Magnetic Button Effect
export const MagneticButton = ({ children, strength = 20, ...props }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const buttonRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / strength;
    const deltaY = (e.clientY - centerY) / strength;
    
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      className="magnetic-button"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Text Animation Effects
export const TypewriterText = ({ text, speed = 50, delay = 0 }) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, delay]);

  return (
    <span className="typewriter-text">
      {displayText}
      <motion.span
        className="cursor"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </span>
  );
};

// Export CSS for micro-animations
export const microAnimationStyles = `
  .ripple-button {
    position: relative;
    overflow: hidden;
    border: none;
    outline: none;
    cursor: pointer;
  }

  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    pointer-events: none;
    animation: ripple-animation 0.6s ease-out;
  }

  @keyframes ripple-animation {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 400px;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .floating-action-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    z-index: 1000;
  }

  .progress-container {
    width: 100%;
    height: 4px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    border-radius: 2px;
  }

  .flip-card {
    perspective: 1000px;
    cursor: pointer;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .flip-card-front,
  .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 8px;
  }

  .flip-card-back {
    transform: rotateY(180deg);
  }

  .magnetic-button {
    border: none;
    background: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .magnetic-button:hover {
    background: #2563eb;
  }

  .typewriter-text {
    font-family: 'Courier New', monospace;
  }

  .cursor {
    font-weight: 100;
  }
`;