import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Shield, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiService, Product } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCAD } from "@/lib/currency";
import Layout from "@/components/Layout";
// import StripePaymentWrapper from "@/components/StripePayment"; // Replaced by Stripe Checkout redirect

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [currentStep, setCurrentStep] = useState<'form'>('form');
  const [orderCreated, setOrderCreated] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0
  });

  const [cartProducts, setCartProducts] = useState<Product[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    customer_email: "",
    customer_first_name: "",
    customer_last_name: "",
    customer_phone: "",
    billing_address_line1: "",
    billing_address_line2: "",
    billing_city: "",
    billing_state: "",
    billing_postal_code: "",
    billing_country: "CA",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "CA",
  });

  // Handle retry parameter for failed payments
  useEffect(() => {
    const retryOrder = searchParams.get('retry');
    if (retryOrder) {
      toast({
        title: "Retrying Payment",
        description: `Continuing with order #${retryOrder}. Please complete the payment below.`,
      });
      // Clear the retry parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('retry');
      navigate(`/checkout?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cartItems.length === 0) {
        setFetchingProducts(false);
        return;
      }

      try {
        setFetchingProducts(true);
        console.log('Fetching products for cart items:', cartItems);
        
        const products = await Promise.all(
          cartItems.map(async (item) => {
            try {
              const product = await apiService.getProduct(item.productId);
              console.log(`Fetched product ${item.productId}:`, product);
              return product;
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              throw error;
            }
          })
        );
        setCartProducts(products);
        
        // Calculate totals using the correct property names
        const orderItems = cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }));
        
        console.log('Calculating order total with:', { items: orderItems, billing_country: formData.billing_country });
        
        try {
          const totalData = await apiService.calculateOrderTotal({
            items: orderItems,
            billing_country: formData.billing_country
          });
          console.log('Order total calculated successfully:', totalData);
          setOrderTotals(totalData);
        } catch (totalError: any) {
          console.error('Error calculating order total:', totalError);
          
          // Check if this is a validation error (400 status)
          if (totalError.response?.status === 400) {
            toast({
              title: "Cart Validation Failed",
              description: "Some items in your cart are no longer available or have changed. Please review your cart.",
              variant: "destructive",
            });
            navigate('/cart');
            return;
          }
          
          // For other errors, set default totals
          const defaultSubtotal = products.reduce((sum, product, index) => {
            const item = cartItems[index];
            return sum + (Number(product.price) * item.quantity);
          }, 0);
          
          setOrderTotals({
            subtotal: defaultSubtotal,
            tax_amount: defaultSubtotal * 0.13, // Default 13% tax
            total_amount: defaultSubtotal * 1.13
          });
          
          toast({
            title: "Tax calculation unavailable",
            description: "Using estimated tax rate. Final tax will be calculated at checkout.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error fetching cart data:', error);
        toast({
          title: "Error",
          description: "Failed to load cart data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setFetchingProducts(false);
      }
    };

    fetchCartProducts();
  }, [cartItems, formData.billing_country, toast]);

  const cartWithDetails = cartItems.map((item, index) => ({
    ...item,
    product: cartProducts[index]
  })).filter(item => item.product);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      let formatted = '';
      if (match[1]) {
        formatted += `(${match[1]}`;
        if (match[1].length === 3) {
          formatted += ') ';
        }
      }
      if (match[2]) {
        formatted += match[2];
        if (match[2].length === 3) {
          formatted += '-';
        }
      }
      if (match[3]) {
        formatted += match[3];
      }
      return formatted;
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    // Format phone number while typing
    if (field === 'customer_phone') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Copy billing address to shipping if same address is checked
    if (sameAsShipping && field.startsWith('billing_')) {
      const shippingField = field.replace('billing_', 'shipping_');
      setFormData(prev => ({ ...prev, [shippingField]: value }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.customer_first_name.trim()) {
      errors.customer_first_name = 'First name is required';
    }
    if (!formData.customer_last_name.trim()) {
      errors.customer_last_name = 'Last name is required';
    }
    if (!formData.customer_email.trim()) {
      errors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = 'Please enter a valid email address';
    }
    if (!formData.billing_address_line1.trim()) {
      errors.billing_address_line1 = 'Billing address is required';
    }
    if (!formData.billing_city.trim()) {
      errors.billing_city = 'City is required';
    }
    if (!formData.billing_state.trim()) {
      errors.billing_state = 'Province/State is required';
    }
    if (!formData.billing_postal_code.trim()) {
      errors.billing_postal_code = 'Postal Code/ZIP is required';
    }

    // Phone validation (if provided)
    if (formData.customer_phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.customer_phone)) {
      errors.customer_phone = 'Please enter a valid phone number';
    }

    // If different shipping address, validate those fields too
    if (!sameAsShipping) {
      if (!formData.shipping_address_line1.trim()) {
        errors.shipping_address_line1 = 'Shipping address is required';
      }
      if (!formData.shipping_city.trim()) {
        errors.shipping_city = 'Shipping city is required';
      }
      if (!formData.shipping_state.trim()) {
        errors.shipping_state = 'Shipping province/state is required';
      }
      if (!formData.shipping_postal_code.trim()) {
        errors.shipping_postal_code = 'Shipping postal code/ZIP is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shipping_address_line1: prev.billing_address_line1,
        shipping_address_line2: prev.billing_address_line2,
        shipping_city: prev.billing_city,
        shipping_state: prev.billing_state,
        shipping_postal_code: prev.billing_postal_code,
        shipping_country: prev.billing_country,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Final cart validation before creating order
      const cartValidation = await apiService.validateCart({
        items: cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }))
      });
      
      if (cartValidation.cart_changed) {
        toast({
          title: "Cart Changed",
          description: "Your cart has changed since you started checkout. Please review and try again.",
          variant: "destructive",
        });
        navigate('/cart');
        return;
      }
      
      const orderData = {
        ...formData,
        subtotal: orderTotals.subtotal,
        tax_amount: orderTotals.tax_amount,
        total_amount: orderTotals.total_amount,
        payment_method: 'card', // Always use Stripe
        order_items: cartItems.map((item, index) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: cartProducts[index]?.price || 0
        }))
      };

      const order = await apiService.createOrder(orderData);
      setOrderCreated(order);
      
      // Immediately create a Stripe Checkout Session and redirect
      try {
        const sessionResp = await apiService.createCheckoutSession(order.order_number, orderData.order_items.map(oi => ({
          name: cartProducts.find(p => p.id === oi.product_id)?.name || 'Product',
          price: oi.price,
          quantity: oi.quantity,
        })));
        if (sessionResp.url) {
          window.location.href = sessionResp.url;
          return;
        } else {
          throw new Error('Failed to start hosted checkout');
        }
      } catch (err) {
        console.error('Error creating checkout session', err);
        throw err;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Order failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    
    toast({
      title: "Payment successful!",
      description: `Order #${orderCreated.order_number} has been processed.`,
    });
    
    navigate(`/order-confirmation/token/${orderCreated.confirmation_token}`);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/cart" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Empty Cart Check */}
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-8">
              You need items in your cart to proceed with checkout.
            </p>
            <Link to="/shop">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Contact & Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      value={formData.customer_first_name}
                      onChange={(e) => handleInputChange('customer_first_name', e.target.value)}
                      className={formErrors.customer_first_name ? 'border-red-500' : ''}
                      required 
                    />
                    {formErrors.customer_first_name && (
                      <p className="text-sm text-red-500">{formErrors.customer_first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      value={formData.customer_last_name}
                      onChange={(e) => handleInputChange('customer_last_name', e.target.value)}
                      className={formErrors.customer_last_name ? 'border-red-500' : ''}
                      required 
                    />
                    {formErrors.customer_last_name && (
                      <p className="text-sm text-red-500">{formErrors.customer_last_name}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    className={formErrors.customer_email ? 'border-red-500' : ''}
                    required 
                  />
                  {formErrors.customer_email && (
                    <p className="text-sm text-red-500">{formErrors.customer_email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    className={formErrors.customer_phone ? 'border-red-500' : ''}
                    placeholder="(555) 123-4567"
                  />
                  {formErrors.customer_phone && (
                    <p className="text-sm text-red-500">{formErrors.customer_phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Address *</Label>
                  <Input 
                    id="billingAddress" 
                    value={formData.billing_address_line1}
                    onChange={(e) => handleInputChange('billing_address_line1', e.target.value)}
                    className={formErrors.billing_address_line1 ? 'border-red-500' : ''}
                    required 
                  />
                  {formErrors.billing_address_line1 && (
                    <p className="text-sm text-red-500">{formErrors.billing_address_line1}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="billingAddress2" 
                    value={formData.billing_address_line2}
                    onChange={(e) => handleInputChange('billing_address_line2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City *</Label>
                    <Input 
                      id="billingCity" 
                      value={formData.billing_city}
                      onChange={(e) => handleInputChange('billing_city', e.target.value)}
                      className={formErrors.billing_city ? 'border-red-500' : ''}
                      required 
                    />
                    {formErrors.billing_city && (
                      <p className="text-sm text-red-500">{formErrors.billing_city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingState">Province/State *</Label>
                    <Input 
                      id="billingState" 
                      value={formData.billing_state}
                      onChange={(e) => handleInputChange('billing_state', e.target.value)}
                      className={formErrors.billing_state ? 'border-red-500' : ''}
                      required 
                    />
                    {formErrors.billing_state && (
                      <p className="text-sm text-red-500">{formErrors.billing_state}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingZip">Postal Code/ZIP *</Label>
                    <Input 
                      id="billingZip" 
                      value={formData.billing_postal_code}
                      onChange={(e) => handleInputChange('billing_postal_code', e.target.value)}
                      className={formErrors.billing_postal_code ? 'border-red-500' : ''}
                      required 
                    />
                    {formErrors.billing_postal_code && (
                      <p className="text-sm text-red-500">{formErrors.billing_postal_code}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCountry">Country</Label>
                  <Select value={formData.billing_country} onValueChange={(value) => handleInputChange('billing_country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sameAsShipping" 
                    checked={sameAsShipping}
                    onCheckedChange={handleSameAsShippingChange}
                  />
                  <Label htmlFor="sameAsShipping">Same as billing address</Label>
                </div>
                
                {!sameAsShipping && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress">Address *</Label>
                      <Input 
                        id="shippingAddress" 
                        value={formData.shipping_address_line1}
                        onChange={(e) => handleInputChange('shipping_address_line1', e.target.value)}
                        className={formErrors.shipping_address_line1 ? 'border-red-500' : ''}
                        required 
                      />
                      {formErrors.shipping_address_line1 && (
                        <p className="text-sm text-red-500">{formErrors.shipping_address_line1}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress2">Address Line 2 (Optional)</Label>
                      <Input 
                        id="shippingAddress2" 
                        value={formData.shipping_address_line2}
                        onChange={(e) => handleInputChange('shipping_address_line2', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shippingCity">City *</Label>
                        <Input 
                          id="shippingCity" 
                          value={formData.shipping_city}
                          onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                          className={formErrors.shipping_city ? 'border-red-500' : ''}
                          required 
                        />
                        {formErrors.shipping_city && (
                          <p className="text-sm text-red-500">{formErrors.shipping_city}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingState">Province/State *</Label>
                        <Input 
                          id="shippingState" 
                          value={formData.shipping_state}
                          onChange={(e) => handleInputChange('shipping_state', e.target.value)}
                          className={formErrors.shipping_state ? 'border-red-500' : ''}
                          required 
                        />
                        {formErrors.shipping_state && (
                          <p className="text-sm text-red-500">{formErrors.shipping_state}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingZip">Postal Code/ZIP *</Label>
                        <Input 
                          id="shippingZip" 
                          value={formData.shipping_postal_code}
                          onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                          className={formErrors.shipping_postal_code ? 'border-red-500' : ''}
                          required 
                        />
                        {formErrors.shipping_postal_code && (
                          <p className="text-sm text-red-500">{formErrors.shipping_postal_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCountry">Country</Label>
                      <Select value={formData.shipping_country} onValueChange={(value) => handleInputChange('shipping_country', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stripe hosted Checkout handles payment externally now */}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartWithDetails.map((item) => {
                    // Get the image at order 0 from the images array
                    const imageUrl = item.product.images?.find(img => img.order === 0)?.image_url;
                    
                    return (
                      <div key={item.productId} className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground text-center">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link 
                              to={`/product/${item.product.id}`}
                              className="font-medium text-sm text-primary hover:underline"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-sm">
                          {formatCAD(Number(item.product.price) * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCAD(orderTotals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCAD(orderTotals.tax_amount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    * Shipping will be calculated and communicated via email
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCAD(orderTotals.total_amount)}</span>
                </div>

                {currentStep === 'form' && (
                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={loading || cartItems.length === 0}
                  >
                    {loading ? "Processing..." : "Pay with Stripe"}
                  </Button>
                )}

                {/* Payment step removed for hosted Checkout */}

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Secure checkout with SSL encryption
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Questions about your order? Our team is here to help.
                </p>
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;