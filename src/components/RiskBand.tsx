import React from 'react';
import './RiskBand.css';

export type RiskBandLevel = 'success' | 'warning' | 'danger';

export interface RiskBandProps extends React.HTMLAttributes<HTMLDivElement> {
  level: RiskBandLevel;
  children: React.ReactNode;
}

export function RiskBand({ level, children, className = '', ...props }: RiskBandProps) {
  return (
    <div className={`risk-band ${className}`} {...props}>
      <div 
        className={`risk-band__pattern risk-band__pattern--${level}`} 
        aria-hidden="true" 
        data-testid={`risk-band-pattern-${level}`}
      />
      <div className="risk-band__content">
        {children}
      </div>
    </div>
  );
}
