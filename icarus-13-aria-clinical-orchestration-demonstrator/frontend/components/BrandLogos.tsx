import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

/**
 * Official ARIA Primary Header Logo
 * Sleek futuristic geometric typography with glowing horizon arc and no harsh borders
 */
export const AriaHeaderLogo: React.FC<LogoProps> = ({ className = '', size = 'md', showSubtitle = false }) => {
  const textSizes = {
    sm: 'text-[12px] tracking-[0.34em]',
    md: 'text-[14px] tracking-[0.36em]',
    lg: 'text-[18px] tracking-[0.40em]'
  };

  const arcSizes = {
    sm: 'w-16 h-2',
    md: 'w-20 h-2.5',
    lg: 'w-28 h-3.5'
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none border-none outline-none ${className}`}>
      {/* Official Horizon Arc */}
      <svg
        viewBox="0 0 240 32"
        className={`${arcSizes[size]} -mb-0.5 opacity-90 drop-shadow-[0_1px_6px_rgba(255,255,255,0.25)]`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <use href="public/brand.svg#aria-arc" />
      </svg>

      {/* Official Geometric ARIA Wordmark */}
      <div className="flex items-center">
        <span
          className={`font-sans font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none ${textSizes[size]}`}
          style={{ letterSpacing: '0.35em', textShadow: '0 0 16px rgba(255,255,255,0.15)' }}
        >
          ARIA
        </span>
      </div>

      {showSubtitle && (
        <span className="text-[8px] font-mono tracking-[0.2em] text-anthracite-500 uppercase mt-0.5">
          Clinical Intelligence
        </span>
      )}
    </div>
  );
};

/**
 * Official ICARUS Primary Brand Logo with winged crest emblem and geometric metallic wordmark
 */
export const IcarusLogo: React.FC<LogoProps> = ({ className = '', size = 'md', showSubtitle = false }) => {
  const emblemSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-[11px] tracking-[0.28em]',
    md: 'text-[13px] tracking-[0.32em]',
    lg: 'text-[16px] tracking-[0.36em]'
  };

  return (
    <div className={`inline-flex items-center space-x-2 select-none border-none outline-none ${className}`}>
      {/* Official Winged Crest */}
      <svg
        viewBox="0 0 100 80"
        className={`${emblemSizes[size]} shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ICARUS Official Emblem"
      >
        <use href="public/brand.svg#icarus-emblem" />
      </svg>

      {/* Official Geometric Wordmark */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-sans font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none ${textSizes[size]}`}
          style={{ letterSpacing: '0.28em', textShadow: '0 0 18px rgba(255,255,255,0.12)' }}
        >
          ICARUS
        </span>
        {showSubtitle && (
          <span className="text-[8.5px] font-mono tracking-[0.18em] text-anthracite-500 uppercase mt-0.5">
            Clinical Orchestration
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Official ARIA Wordmark matching the ICARUS typography, metallic silver gradient, and horizon arc
 */
export const AriaWordmark: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg'; withArc?: boolean }> = ({
  className = '',
  size = 'md',
  withArc = false
}) => {
  const textSizes = {
    sm: 'text-[10px] tracking-[0.26em]',
    md: 'text-[12px] tracking-[0.32em]',
    lg: 'text-[15px] tracking-[0.38em]'
  };

  return (
    <div className={`inline-flex flex-col items-center select-none border-none outline-none ${className}`}>
      {withArc && (
        <svg
          viewBox="0 0 240 32"
          className="w-16 h-2 mb-0.5 opacity-90 drop-shadow-[0_1px_4px_rgba(255,255,255,0.2)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <use href="public/brand.svg#aria-arc" />
        </svg>
      )}
      <span
        className={`font-sans font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none ${textSizes[size]}`}
        style={{ letterSpacing: '0.30em' }}
      >
        ARIA
      </span>
    </div>
  );
};

/**
 * Unified Header Brand Lockup
 */
export const UnifiedBrandLockup: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false
}) => {
  return (
    <div className={`inline-flex items-center space-x-2 border-none outline-none ${className}`}>
      <IcarusLogo size={compact ? 'sm' : 'md'} />
    </div>
  );
};
