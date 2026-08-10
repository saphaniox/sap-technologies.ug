// Professional SVG Icon Library for Awards Categories
// Scalable, brand-aligned icons with consistent styling

import React from 'react';

const IconLibrary = {
  // Trophy - Excellence & Achievement
  trophy: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 9C6 8.44772 6.44772 8 7 8H17C17.5523 8 18 8.44772 18 9V11C18 13.7614 15.7614 16 13 16H12.5M12.5 16C12.5 17.933 11.433 19 10 19H14C12.567 19 11.5 17.933 11.5 16M12.5 16H11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16V19M9 22H15M6 8V6C6 5.44772 5.55228 5 5 5H3M18 8V6C18 5.44772 18.4477 5 19 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Star - Excellence & Recognition
  star: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
    </svg>
  ),

  // Medal - Awards & Honor
  medal: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="15" r="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      <path d="M8.5 9L7 2L12 5L17 2L15.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Crown - Leadership & Prestige
  crown: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 6L9 12L3 9L4 19H20L21 9L15 12L12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="3" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="21" cy="9" r="1.5" fill="currentColor"/>
    </svg>
  ),

  // Rocket - Innovation & Growth
  rocket: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2C12 2 6 7 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13C18 7 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
      <path d="M9 19L7 22M15 19L17 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 12C5 12 3.5 11 2 12M19 12C19 12 20.5 11 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Lightbulb - Innovation & Ideas
  lightbulb: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9 18H15M10 21H14M12 3C8.68629 3 6 5.68629 6 9C6 11.0642 7.07462 12.8717 8.68377 13.8944C8.87711 14.0119 9 14.2217 9 14.4472V15C9 15.5523 9.44772 16 10 16H14C14.5523 16 15 15.5523 15 15V14.4472C15 14.2217 15.1229 14.0119 15.3162 13.8944C16.9254 12.8717 18 11.0642 18 9C18 5.68629 15.3137 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 3V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Heart - Community & Social Impact
  heart: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 21L10.55 19.7051C5.4 15.1242 2 12.1029 2 8.39509C2 5.37384 4.42 3 7.5 3C9.24 3 10.91 3.81266 12 5.08861C13.09 3.81266 14.76 3 16.5 3C19.58 3 22 5.37384 22 8.39509C22 12.1029 18.6 15.1242 13.45 19.7149L12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
    </svg>
  ),

  // Users - Community & People
  users: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M2 21V19C2 16.7909 3.79086 15 6 15H12C14.2091 15 16 16.7909 16 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M22 21V19.5C22 17.567 20.433 16 18.5 16H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Globe - Global Impact
  globe: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05"/>
      <path d="M2 12H22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 5C7.5 7.5 9 9.5 12 12C15 14.5 16.5 16.5 19 19M5 19C7.5 16.5 9 14.5 12 12C15 9.5 16.5 7.5 19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),

  // Flag - Regional/National
  flag: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 22V4M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
    </svg>
  ),

  // Chart - Data & Analytics
  chart: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 16L12 11L15 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="16" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="21" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  ),

  // Shield - Security & Trust
  shield: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Target - Goals & Achievement
  target: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
    </svg>
  ),

  // Briefcase - Business & Enterprise
  briefcase: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 12H21" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),

  // Sparkles - Excellence & Quality
  sparkles: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
      <path d="M18 3L18.5 4.5L20 5L18.5 5.5L18 7L17.5 5.5L16 5L17.5 4.5L18 3Z" fill="currentColor"/>
      <path d="M6 17L6.5 18.5L8 19L6.5 19.5L6 21L5.5 19.5L4 19L5.5 18.5L6 17Z" fill="currentColor"/>
    </svg>
  ),

  // Checkmark - Approval & Completion
  check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Clock - Pending/Time
  clock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Ballot - Voting
  ballot: (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M9 8H15M9 12H15M9 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

// Icon component wrapper with default props
export const Icon = ({ name, className = '', size = 24, color = 'currentColor', ...props }) => {
  const IconComponent = IconLibrary[name] || IconLibrary.trophy;
  
  return (
    <IconComponent
      width={size}
      height={size}
      className={`award-icon ${className}`}
      style={{ color }}
      aria-hidden="true"
      {...props}
    />
  );
};

export default IconLibrary;
