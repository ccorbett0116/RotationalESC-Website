import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import Layout from "@/components/Layout";
import { CheckCircle, Loader2 } from "lucide-react";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const orderNumber = searchParams.get('order');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !orderNumber) {
        setError('Missing session information');
        setLoading(false);
        return;
      }

      try {
        // Verify the checkout session with the backend
        const result = await apiService.verifyCheckoutSession(sessionId, orderNumber);
        
        // If verification successful, redirect to order confirmation
        if (result.verified) {
          navigate(`/order-confirmation/${orderNumber}`, { replace: true });
        } else {
          // Payment verification failed
          navigate(`/payment-failed?order=${orderNumber}&reason=verification_failed`, { replace: true });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        // Redirect to failure page with appropriate reason
        const errorMessage = error instanceof Error ? error.message : 'unknown';
        const reason = errorMessage.includes('expired') ? 'expired' : 
                      errorMessage.includes('declined') ? 'card_declined' :
                      errorMessage.includes('insufficient') ? 'insufficient_funds' : 'processing_error';
        
        navigate(`/payment-failed?order=${orderNumber}&reason=${reason}`, { replace: true });
      }
    };

    verifyPayment();
  }, [sessionId, orderNumber, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Processing Your Payment
            </h1>
            <p className="text-lg text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-2xl">✕</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Payment Verification Failed
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Return to Checkout
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // This shouldn't render as we redirect on success, but just in case
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground">
            Redirecting to your order confirmation...
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccess;
