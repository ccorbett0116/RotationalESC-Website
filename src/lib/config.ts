// Runtime configuration that reads from window.ENV (injected by nginx entrypoint)
// Falls back to Vite environment variables for development

declare global {
  interface Window {
    ENV?: {
      VITE_STRIPE_PUBLISHABLE_KEY?: string;
    };
  }
}

const getConfig = () => {
  return {
    stripePublishableKey: window.ENV?.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  };
};

export const config = new Proxy({} as ReturnType<typeof getConfig>, {
  get(target, prop) {
    return getConfig()[prop as keyof ReturnType<typeof getConfig>];
  }
});
