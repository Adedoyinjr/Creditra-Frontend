import React from 'react';
import { motionClasses, useReducedMotion } from '@/context/ReducedMotionContext';

/**
 * SmartPayCTA Component
 * 
 * A call-to-action component for the GrantFox FWC26 campaign (Stellar Wave).
 * This component uses responsive images via `srcset` to ensure that mobile
 * devices do not download desktop-sized assets, saving bandwidth and improving
 * load times.
 */
export const SmartPayCTA: React.FC = () => {
  const { isReducedMotionActive } = useReducedMotion();

  return (
    <div className={`smartpay-cta mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm ${motionClasses(isReducedMotionActive, 'transition-shadow hover:shadow-md')}`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground">
          Stellar Wave Campaign - Smart Pay
        </h2>
        <p className="mt-2 text-muted">
          Join the GrantFox FWC26 campaign and take advantage of our new Smart Pay features. Optimize your repayments effortlessly.
        </p>
      </div>
      
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-border">
        {/* 
          Responsive Image implementation using srcset.
          This ensures that devices only download the appropriately sized asset.
        */}
        <img
          src="/assets/images/stellar-wave-lg.jpg"
          srcSet="
            /assets/images/stellar-wave-sm.jpg 400w,
            /assets/images/stellar-wave-md.jpg 800w,
            /assets/images/stellar-wave-lg.jpg 1200w
          "
          sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px"
          alt="Stellar Wave Campaign - GrantFox FWC26"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-6">
        <button
          type="button"
          className={`w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${motionClasses(isReducedMotionActive, 'transition-all hover:brightness-110')}`}
        >
          Enable Smart Pay
        </button>
      </div>
    </div>
  );
};

export default SmartPayCTA;
