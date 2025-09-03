import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Truck, Shield, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiService, Product } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const Checkout = () => {
  const navigate = useNavigate();
  const { items: cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    tax_amount: 0,
    shipping_amount: 0,
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
    billing_country: "US",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "US",
  });

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cartItems.length === 0) {
        setFetchingProducts(false);
        return;
      }

      try {
        setFetchingProducts(true);
        const products = await Promise.all(
          cartItems.map(item => apiService.getProduct(item.productId))
        );
        setCartProducts(products);
        
        // Calculate totals using the correct property names
        const orderItems = cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }));
        
        const totalData = await apiService.calculateOrderTotal({
          items: orderItems,
          shipping_method: shippingMethod
        });
        setOrderTotals(totalData);
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
  }, [cartItems, shippingMethod, toast]);

  const cartWithDetails = cartItems.map((item, index) => ({
    ...item,
    product: cartProducts[index]
  })).filter(item => item.product);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Copy billing address to shipping if same address is checked
    if (sameAsShipping && field.startsWith('billing_')) {
      const shippingField = field.replace('billing_', 'shipping_');
      setFormData(prev => ({ ...prev, [shippingField]: value }));
    }
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
    setLoading(true);
    
    try {
      const orderData = {
        ...formData,
        subtotal: orderTotals.subtotal,
        tax_amount: orderTotals.tax_amount,
        shipping_amount: orderTotals.shipping_amount,
        total_amount: orderTotals.total_amount,
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        order_items: cartItems.map((item, index) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: cartProducts[index]?.price || 0
        }))
      };

      const order = await apiService.createOrder(orderData);
      
      // Clear the cart after successful order
      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `Order #${order.order_number} has been created.`,
      });
      
      navigate(`/order-confirmation/${order.order_number}`);
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
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.customer_first_name}
                      onChange={(e) => handleInputChange('customer_first_name', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.customer_last_name}
                      onChange={(e) => handleInputChange('customer_last_name', e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  />
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
                  <Label htmlFor="billingAddress">Address</Label>
                  <Input 
                    id="billingAddress" 
                    value={formData.billing_address_line1}
                    onChange={(e) => handleInputChange('billing_address_line1', e.target.value)}
                    required 
                  />
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
                    <Label htmlFor="billingCity">City</Label>
                    <Input 
                      id="billingCity" 
                      value={formData.billing_city}
                      onChange={(e) => handleInputChange('billing_city', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input 
                      id="billingState" 
                      value={formData.billing_state}
                      onChange={(e) => handleInputChange('billing_state', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingZip">ZIP Code</Label>
                    <Input 
                      id="billingZip" 
                      value={formData.billing_postal_code}
                      onChange={(e) => handleInputChange('billing_postal_code', e.target.value)}
                      required 
                    />
                  </div>
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
                      <Label htmlFor="shippingAddress">Address</Label>
                      <Input 
                        id="shippingAddress" 
                        value={formData.shipping_address_line1}
                        onChange={(e) => handleInputChange('shipping_address_line1', e.target.value)}
                        required 
                      />
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
                        <Label htmlFor="shippingCity">City</Label>
                        <Input 
                          id="shippingCity" 
                          value={formData.shipping_city}
                          onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingState">State</Label>
                        <Input 
                          id="shippingState" 
                          value={formData.shipping_state}
                          onChange={(e) => handleInputChange('shipping_state', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingZip">ZIP Code</Label>
                        <Input 
                          id="shippingZip" 
                          value={formData.shipping_postal_code}
                          onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded">
                    <RadioGroupItem value="standard" id="standard" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="font-medium">
                        Standard Shipping (5-7 business days)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {orderTotals.subtotal > 5000 ? "FREE" : "$150.00"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded">
                    <RadioGroupItem value="express" id="express" />
                    <div className="flex-1">
                      <Label htmlFor="express" className="font-medium">
                        Express Shipping (2-3 business days)
                      </Label>
                      <p className="text-sm text-muted-foreground">$250.00</p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purchase-order" id="purchase-order" />
                    <Label htmlFor="purchase-order">Purchase Order</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" />
                    </div>
                  </div>
                )}

                {paymentMethod === "purchase-order" && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="poNumber">Purchase Order Number</Label>
                      <Input id="poNumber" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Net 30 terms will apply. Order will be processed upon PO approval.
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox id="billing-same" defaultChecked />
                  <Label htmlFor="billing-same" className="text-sm">
                    Billing address is the same as shipping address
                  </Label>
                </div>
              </CardContent>
            </Card>
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
                  {cartWithDetails.map((item) => (
                    <div key={item.productId} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                          {item.product.primary_image ? (
                            <img
                              src={item.product.primary_image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No Image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium text-sm">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${orderTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {orderTotals.shipping_amount === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `$${orderTotals.shipping_amount.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${orderTotals.tax_amount.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${orderTotals.total_amount.toFixed(2)}</span>
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={loading || cartItems.length === 0}
                >
                  {loading ? "Processing..." : "Place Order"}
                </Button>

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