import React from 'react';

export default function OliveAvatar({ size = 'md', animated = true }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0 ${animated ? 'animate-pulse' : ''}`}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Face */}
        <circle cx="50" cy="50" r="45" fill="#dcfce7" stroke="#10b981" strokeWidth="2" />
        
        {/* Head */}
        <circle cx="50" cy="35" r="25" fill="#fdbf60" />
        
        {/* Hair */}
        <path d="M 25 25 Q 25 10 50 8 Q 75 10 75 25" fill="#d4841f" />
        
        {/* Left eye */}
        <circle cx="40" cy="32" r="4" fill="#1f2937" />
        <circle cx="41" cy="31" r="1.5" fill="white" />
        
        {/* Right eye */}
        <circle cx="60" cy="32" r="4" fill="#1f2937" />
        <circle cx="61" cy="31" r="1.5" fill="white" />
        
        {/* Smile */}
        <path d="M 40 42 Q 50 48 60 42" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Nose */}
        <line x1="50" y1="32" x2="50" y2="40" stroke="#d4841f" strokeWidth="1.5" />
        
        {/* Body/shoulders */}
        <ellipse cx="50" cy="65" rx="28" ry="22" fill="#10b981" />
        
        {/* Arms - leaf-like */}
        <ellipse cx="25" cy="60" rx="12" ry="18" fill="#34d399" transform="rotate(-30 25 60)" />
        <ellipse cx="75" cy="60" rx="12" ry="18" fill="#34d399" transform="rotate(30 75 60)" />
        
        {/* Leaf accent */}
        <path d="M 48 15 Q 50 12 52 15 Q 50 20 48 15" fill="#10b981" />
      </svg>
    </div>
  );
}