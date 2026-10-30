import React from 'react';
import { BiRightArrowAlt, BiCalendar } from 'react-icons/bi';

export default function WelcomeBanner({ name, role, subtext, actionText, onAction }) {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="relative overflow-hidden rounded-panel bg-maroon-900 shadow-lift">
      
      {/* 1. Soft Warm Glow (Left Side) - Draws focus to the text */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-maroon-700/40 blur-3xl pointer-events-none" />
      
      {/* 2. Subtle Grid Texture (Very faint, covers the whole banner) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* 3. Main Content Container */}
      <div className="relative z-10 flex flex-col justify-between gap-8 p-8 sm:flex-row sm:items-center sm:p-10">
        
        {/* Left Side: Greeting & Text */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white/90 uppercase backdrop-blur-sm">
            <span>{role}</span>
          </div>
          
          <h1 className="font-display text-4xl text-white sm:text-5xl tracking-tight">
            Hello, <span className="italic font-light">{name || 'User'}</span>
          </h1>
          
          <p className="text-base text-white/80 leading-relaxed max-w-xl">
            {subtext}
          </p>
        </div>
        
        {/* Right Side: Date & Action */}
        <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <BiCalendar className="text-lg" />
            <span>{today}</span>
          </div>
          
          {actionText && (
            <button 
              onClick={onAction}
              className="group inline-flex items-center gap-2 rounded-ctl bg-white px-6 py-3 text-sm font-bold text-maroon-900 transition-all hover:bg-brand-soft hover:shadow-lg active:scale-95"
            >
              {actionText}
              <BiRightArrowAlt className="text-xl transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}