import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, ArrowLeft, CreditCard, Phone, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { apiService } from "@/services/api";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderNumber = searchParams.get('order');
  const reason = searchParams.get('reason') || 'unknown';

  // Notify owner about payment failure when component mounts
  useEffect(() => {
    const notifyOwner = async () => {
      if (orderNumber && reason) {
        try {
          const reasonText = getReasonText(reason);
          await apiService.notifyPaymentCancelled(orderNumber, reasonText);
          console.log('Owner notified about payment failure');
        } catch (error) {
          console.error('Failed to notify owner:', error);
          // Don't show error to user as this is a background operation
        }
      }
    };

    notifyOwner();
  }, [orderNumber, reason]);

  const getReasonText = (reason: string): string => {
    switch (reason.toLowerCase()) {
      case 'cancelled':
        return 'Customer cancelled the payment';
      case 'expired':
        return 'Payment session expired';
      case 'card_declined':
        return 'Card was declined';
      case 'insufficient_funds':
        return 'Insufficient funds';
      case 'processing_error':
        return 'Payment processing error';
      case 'verification_failed':
        return 'Payment verification failed';
      default:
        return `Payment failed: ${reason}`;
    }
  };

  const getFailureMessage = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'cancelled':
        return {
          title: "Payment Cancelled",
          description: "You cancelled the payment process. Your order is still saved and you can complete payment later.",
          suggestion: "You can return to checkout and try again, or contact us for assistance."
        };
      case 'expired':
        return {
          title: "Payment Session Expired",
          description: "Your payment session has expired for security reasons.",
          suggestion: "Please return to checkout and start the payment process again."
        };
      case 'card_declined':
        return {
          title: "Card Declined",
          description: "Your payment method was declined by your bank or card issuer.",
          suggestion: "Please try a different payment method or contact your bank."
        };
      case 'insufficient_funds':
        return {
          title: "Insufficient Funds",
          description: "Your payment was declined due to insufficient funds.",
          suggestion: "Please check your account balance or try a different payment method."
        };
      case 'processing_error':
        return {
          title: "Processing Error",
          description: "There was an error processing your payment.",
          suggestion: "Please try again or contact our support team for assistance."
        };
      default:
        return {
          title: "Payment Failed",
          description: "We were unable to process your payment at this time.",
          suggestion: "Please try again or contact our support team for assistance."
        };
    }
  };

  const failureInfo = getFailureMessage(reason);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {failureInfo.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {failureInfo.description}
          </p>
        </div>

        {/* Order Information */}
        {orderNumber && (
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Order #{orderNumber}</strong> - Your order has been saved and is waiting for payment.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Try Again */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Try Again
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {failureInfo.suggestion}
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to={orderNumber ? `/checkout?retry=${orderNumber}` : "/checkout"}>
                    Return to Checkout
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/cart">
                    Review Cart
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Get Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Our support team is here to help you complete your order.
              </p>
              <div className="space-y-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/contact">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/shop">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Common Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Common Payment Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Card Issues:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Check that your card details are correct</li>
                  <li>• Ensure your card has sufficient funds</li>
                  <li>• Try a different card or payment method</li>
                  <li>• Contact your bank if the card keeps being declined</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Issues:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Check your internet connection</li>
                  <li>• Try refreshing the page</li>
                  <li>• Clear your browser cache</li>
                  <li>• Try a different browser</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Your payment information is processed securely by Stripe and is never stored on our servers.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentFailed;
