import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ showTagline = true, size = 'md', isDarkBg = false, className = '' }) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px] sm:text-[12px]',
    lg: 'text-[13px]',
  };

  return (
    <Link to="/" className={`inline-flex items-center space-x-3 group ${className}`}>
      {/* Icon Container with 'D' shape + Paper Plane + Speed Lines */}
      <div className={`relative shrink-0 ${iconSizes[size]} transform group-hover:scale-105 transition-transform duration-300`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Main D Gradient */}
            <linearGradient id="dLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1332" />
              <stop offset="45%" stopColor="#1C265E" />
              <stop offset="80%" stopColor="#5D4EE8" />
              <stop offset="100%" stopColor="#7E68F3" />
            </linearGradient>

            {/* Speed Lines Gradient */}
            <linearGradient id="speedLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D7DF5" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
          </defs>

          {/* Capital D Base Icon */}
          <path
            d="M 10 4 H 26 C 36 4 43 11 43 24 C 43 37 36 44 26 44 H 10 C 6.7 44 4 41.3 4 38 V 10 C 4 6.7 6.7 4 10 4 Z"
            fill="url(#dLogoGradient)"
          />

          {/* Speed Lines (Bottom Left Thrust) */}
          <line
            x1="3"
            y1="41"
            x2="11"
            y2="33"
            stroke="url(#speedLineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="45"
            x2="16"
            y2="37"
            stroke="url(#speedLineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* White Paper Airplane Inside D */}
          <path
            d="M 17 31 L 36 12 L 27 34 L 21.5 27.5 L 17 31 Z M 21.5 27.5 L 36 12"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text Block */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black tracking-tight ${titleSizes[size]} ${isDarkBg ? 'text-white' : 'text-[#0B1332]'}`}>
          DealPilot{' '}
          <span className="bg-gradient-to-r from-[#6355E4] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent font-black">
            AI
          </span>
        </div>

        {showTagline && (
          <div className={`font-medium tracking-wide mt-1 ${taglineSizes[size]} ${isDarkBg ? 'text-slate-300' : 'text-[#5A6588]'}`}>
            Smarter Negotiations. Better Deals.
          </div>
        )}
      </div>
    </Link>
  );
}
