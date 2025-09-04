import React, { createContext, useContext, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { config } from '@/lib/config';

// Centralized Stripe initialization with explicit missing-key warning
const stripePublishableKey = config.stripePublishableKey;
if (!stripePublishableKey) {
  console.error('Stripe publishable key missing in StripeContext. Provide VITE_STRIPE_PUBLISHABLE_KEY in environment.');
}
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

interface StripeContextType {
  stripe: Promise<Stripe | null>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <StripeContext.Provider value={{ stripe: stripePromise }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};
