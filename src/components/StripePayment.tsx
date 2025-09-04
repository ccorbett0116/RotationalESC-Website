import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Shield } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/lib/config';

// Initialize Stripe with safety checks so empty key isn't silently used
const publishableKey = config.stripePublishableKey;
if (!publishableKey) {
  // Surface a clear error early in the console for easier debugging
  // (Publishable key is safe to log, but you can mask if preferred.)
  console.error('Stripe publishable key is missing. Ensure VITE_STRIPE_PUBLISHABLE_KEY is provided in environment.');
}
const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

interface StripePaymentFormProps {
  clientSecret: string;
  orderNumber: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  orderNumber,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
        onPaymentError(paymentError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await apiService.confirmPayment(orderNumber, paymentIntent.id);
        
        toast({
          title: "Payment successful!",
          description: "Your order has been processed successfully.",
        });
        
        onPaymentSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Enter your card details to complete the purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="p-3 border border-input rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))',
                    '::placeholder': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  },
                },
              }}
            />
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Secure payment with SSL encryption
            </div>
            <div className="text-lg font-semibold">
              ${totalAmount.toFixed(2)}
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!stripe || loading} 
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

interface StripePaymentWrapperProps {
  clientSecret: string;
  orderNumber: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = (props) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    stripePromise.then((stripe) => {
      if (stripe) {
        setStripeLoaded(true);
      }
    });
  }, []);

  if (!stripeLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentWrapper;
