import React from 'react';

export interface EloraLogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function EloraLogo({ className = 'w-8 h-8', withWordmark = false }: EloraLogoProps) {
  const SvgIcon = (
    <svg 
      className={`shrink-0 ${className}`} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/xml"
    >
      <path d="M250 50L423.205 150V350L250 450L76.7949 350V150L250 50Z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
      <path d="M250 50V180" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
      <path d="M76.7949 150L190 215" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
      <path d="M423.205 150L310 215" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
      <path d="M190 215V285L250 320L310 285V215L250 180L190 215Z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
      <path d="M190 215L250 250L310 215" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
      <path d="M250 250V320" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
      <path d="M190 285L76.7949 350" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
      <path d="M310 285L423.205 350" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
      <path d="M250 320V450" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
    </svg>
  );

  if (withWordmark) {
    return (
      <div className="flex items-center gap-2 text-inherit">
        {SvgIcon}
        <span className="font-bold text-xl tracking-tight">Elora</span>
      </div>
    );
  }

  return SvgIcon;
}

export default EloraLogo;
