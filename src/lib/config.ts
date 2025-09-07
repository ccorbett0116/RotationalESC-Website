// Runtime configuration that reads from window.ENV (injected by nginx entrypoint)
// Falls back to Vite environment variables for development

declare global {
  interface Window {
    ENV?: {
      VITE_STRIPE_PUBLISHABLE_KEY?: string;
      VITE_API_URL?: string;
    };
  }
}

const getConfig = () => {
  // If window.ENV is not available yet, wait a bit and try again
  if (!window.ENV && typeof window !== 'undefined') {
    console.log('window.ENV not available yet, using fallback');
  }
  
  return {
    stripePublishableKey: window.ENV?.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    apiUrl: window.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'https://rotationales.com/api',
  };
};

export const config = new Proxy({} as ReturnType<typeof getConfig>, {
  get(target, prop) {
    return getConfig()[prop as keyof ReturnType<typeof getConfig>];
  }
});
