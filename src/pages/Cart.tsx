import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, CheckCircle, XCircle, RefreshCw, Phone, Mail, MessageCircle } from "lucide-react";
import { apiService, Product, CompanyInfo } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCAD } from "@/lib/currency";
import Layout from "@/components/Layout";

const Cart = () => {
  const { items: cartItems, updateQuantity: updateCartQuantity, removeItem: removeCartItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid_cart_items: Array<{
      product_id: string;
      quantity: number;
      price: number;
      product_name: string;
    }>;
    removed_items: Array<{
      product_id: string;
      product_name: string;
      reason: string;
      message: string;
    }>;
    updated_items: Array<{
      product_id: string;
      product_name: string;
      original_quantity: number;
      adjusted_quantity: number;
      message: string;
    }>;
    cart_changed: boolean;
  } | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  // Separate effect for fetching products and company info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [response, companyData] = await Promise.all([
          apiService.getProducts(),
          apiService.getCompanyInfo()
        ]);
        setProducts(response.results);
        setCompanyInfo(companyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Separate effect for cart validation that runs once when cart loads or changes significantly
  useEffect(() => {
    const validateCartOnMount = async () => {
      if (cartItems.length === 0 || hasValidated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Perform comprehensive cart validation
        const cartItemsForValidation = cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }));
        
        const validation = await apiService.validateCart({
          items: cartItemsForValidation
        });
        
        if (validation.cart_changed) {
          // Auto-apply validation changes immediately
          let changesSummary = [];
          
          // Remove invalid items
          if (validation.removed_items.length > 0) {
            validation.removed_items.forEach(item => {
              removeCartItem(item.product_id);
            });
            changesSummary.push(`${validation.removed_items.length} items removed`);
          }
          
          // Update quantities for adjusted items  
          if (validation.updated_items.length > 0) {
            validation.updated_items.forEach(item => {
              updateCartQuantity(item.product_id, item.adjusted_quantity);
            });
            changesSummary.push(`${validation.updated_items.length} quantities adjusted`);
          }
          
          // Show summary notification
          toast({
            title: "Cart Updated",
            description: `Your cart was automatically updated: ${changesSummary.join(', ')}.`,
            variant: "default",
          });
          
          // Store validation results to show details
          setValidationResults(validation);
          setRemovedItems(validation.removed_items.map(item => item.product_id));
        }
        
        setHasValidated(true);
      } catch (validationError) {
        console.error('Cart validation failed:', validationError);
        toast({
          title: "Cart validation error",
          description: "Unable to validate cart items. Some items may not be current.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    validateCartOnMount();
  }, [cartItems.length, hasValidated, removeCartItem, updateCartQuantity, toast]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Validate against available quantity
      if (newQuantity > product.quantity) {
        toast({
          title: "Quantity limited",
          description: `Only ${product.quantity} units of ${product.name} are available`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if product is still available
      if (!product.is_available && newQuantity > 0) {
        toast({
          title: "Product unavailable",
          description: `${product.name} is no longer available`,
          variant: "destructive",
        });
        removeCartItem(productId);
        return;
      }
    }
    
    updateCartQuantity(productId, newQuantity);
  };

  const removeItem = (productId: string) => {
    removeCartItem(productId);
  };

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setValidating(true);
    
    try {
      // Prepare cart items for validation
      const cartItemsForValidation = cartItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }));
      
      // Call the validation API
      const validation = await apiService.validateCart({
        items: cartItemsForValidation
      });
      
      if (!validation.cart_changed) {
        // Cart is valid, proceed to checkout
        navigate('/checkout');
      } else {
        // Show validation results to user for confirmation
        setValidationResults(validation);
        setShowValidationDialog(true);
      }
    } catch (error) {
      console.error('Cart validation failed:', error);
      toast({
        title: "Validation failed",
        description: "Unable to validate cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const applyValidationChanges = () => {
    if (!validationResults) return;
    
    // Remove invalid items
    validationResults.removed_items.forEach(item => {
      removeCartItem(item.product_id);
    });
    
    // Update quantities for adjusted items
    validationResults.updated_items.forEach(item => {
      updateCartQuantity(item.product_id, item.adjusted_quantity);
    });
    
    setShowValidationDialog(false);
    setValidationResults(null);
    
    toast({
      title: "Cart updated",
      description: `Cart has been updated. ${validationResults.removed_items.length} items removed, ${validationResults.updated_items.length} items adjusted.`,
    });
    
    // If there are still valid items, proceed to checkout
    if (validationResults.valid_cart_items.length > 0) {
      navigate('/checkout');
    }
  };

  const refreshCart = async () => {
    setHasValidated(false);
    setValidationResults(null);
    setLoading(true);
    
    try {
      const cartItemsForValidation = cartItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }));
      
      const validation = await apiService.validateCart({
        items: cartItemsForValidation
      });
      
      if (validation.cart_changed) {
        setValidationResults(validation);
        setShowValidationDialog(true);
      } else {
        toast({
          title: "Cart is up to date",
          description: "All items in your cart are current and available.",
        });
      }
    } catch (error) {
      console.error('Cart refresh failed:', error);
      toast({
        title: "Refresh failed",
        description: "Unable to refresh cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setHasValidated(true);
    }
  };

  // Get product details for cart items, filter out items that don't exist
  const cartWithDetails = cartItems
    .map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId)
    }))
    .filter(item => item.product !== undefined) as Array<{
      productId: string;
      quantity: number;
      product: Product;
    }>;

  const subtotal = cartWithDetails.reduce(
    (sum, item) => sum + (Number(item.product.price) * item.quantity),
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading cart...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Browse our equipment selection and add items to your cart.
            </p>
            <Link to="/shop">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={refreshCart}
              disabled={loading || validating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Cart
            </Button>
          )}
        </div>

        {/* Validation Results Alert */}
        {validationResults && validationResults.cart_changed && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Your cart was automatically updated:</p>
                {validationResults.removed_items.length > 0 && (
                  <div className="text-sm">
                    <strong>Removed items:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResults.removed_items.map((item) => (
                        <li key={item.product_id}>
                          {item.product_name} - {item.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResults.updated_items.length > 0 && (
                  <div className="text-sm">
                    <strong>Quantity adjustments:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResults.updated_items.map((item) => (
                        <li key={item.product_id}>
                          {item.product_name} - Reduced from {item.original_quantity} to {item.adjusted_quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(validationResults.removed_items.length > 0 || validationResults.updated_items.length > 0) && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Need more stock or have questions?</p>
                      <div className="flex gap-2">
                        <Link to="/contact">
                          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                            <MessageCircle className="h-3 w-3" />
                            Contact Us
                          </Button>
                        </Link>
                        {companyInfo?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${companyInfo.phone}`, '_self')}
                            className="flex items-center gap-1.5"
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {removedItems.length > 0 && !validationResults && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some items in your cart are no longer available and have been removed.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartWithDetails.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            <Link
                              to={`/product/${item.product.id}`}
                              className="hover:text-primary"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {item.product.category.name}
                            </Badge>
                            <Badge 
                              variant={item.product.is_available ? "default" : "secondary"}
                              className={item.product.is_available ? "bg-green-100 text-green-800" : ""}
                            >
                              {item.product.is_available ? `${item.product.quantity} in stock` : "Out of Stock"}
                            </Badge>
                            {item.product.is_available && item.product.quantity <= 5 && (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={!item.product.is_available || item.quantity >= item.product.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            {formatCAD(Number(item.product.price) * item.quantity)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCAD(Number(item.product.price))} each
                          </div>
                          {item.product.is_available && item.product.quantity <= 3 && (
                            <div className="text-xs text-amber-600 mt-1">
                              <Link to="/contact" className="hover:underline flex items-center gap-1 justify-end">
                                <MessageCircle className="h-2.5 w-2.5" />
                                Need more?
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Continue Shopping */}
            <div className="pt-4">
              <Link to="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formatCAD(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>{formatCAD(tax)}</span>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  * Shipping will be calculated and communicated via email
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCAD(total)}</span>
                </div>

                {/* Stock Help Section */}
                {validationResults && validationResults.cart_changed && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Need More Inventory?</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Some items were out of stock or had limited quantities. Contact us to check for additional inventory or place a special order.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link to="/contact">
                          <Button variant="outline" size="sm" className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800">
                            <Mail className="h-3 w-3 mr-1.5" />
                            Email Us
                          </Button>
                        </Link>
                        {companyInfo?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${companyInfo.phone}`, '_self')}
                            className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                          >
                            <Phone className="h-3 w-3 mr-1.5" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleProceedToCheckout}
                  disabled={validating || cartItems.length === 0}
                >
                  {validating ? "Validating Cart..." : "Proceed to Checkout"}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Secure checkout with SSL encryption
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about your order? Our experts are here to help.
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

        {/* Validation Dialog */}
        <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cart Validation Required
              </DialogTitle>
            </DialogHeader>
            
            {validationResults && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Some items in your cart need to be updated before checkout:
                </p>

                {/* Removed Items */}
                {validationResults.removed_items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Items to be Removed ({validationResults.removed_items.length})
                    </h4>
                    <div className="space-y-2">
                      {validationResults.removed_items.map((item) => (
                        <Alert key={item.product_id} className="border-destructive/20 bg-destructive/5">
                          <AlertDescription>
                            <strong>{item.product_name}</strong>: {item.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Updated Items */}
                {validationResults.updated_items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Quantity Adjustments ({validationResults.updated_items.length})
                    </h4>
                    <div className="space-y-2">
                      {validationResults.updated_items.map((item) => (
                        <Alert key={item.product_id} className="border-amber-200 bg-amber-50">
                          <AlertDescription>
                            <strong>{item.product_name}</strong>: Quantity changed from {item.original_quantity} to {item.adjusted_quantity}. {item.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Items Summary */}
                {validationResults.valid_cart_items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Valid Items ({validationResults.valid_cart_items.length})
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      These items are ready for checkout:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {validationResults.valid_cart_items.map((item) => (
                        <div key={item.product_id} className="flex justify-between text-sm">
                          <span>{item.product_name}</span>
                          <span>Qty: {item.quantity} × {formatCAD(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Section */}
                {(validationResults.removed_items.length > 0 || validationResults.updated_items.length > 0) && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-sm">Need More Stock?</h5>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact us to check availability or place a special order
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/contact">
                          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                            <MessageCircle className="h-3 w-3" />
                            Contact Us
                          </Button>
                        </Link>
                        {companyInfo?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${companyInfo.phone}`, '_self')}
                            className="flex items-center gap-1.5"
                          >
                            <Phone className="h-3 w-3" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowValidationDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={applyValidationChanges}
                    className="flex-1"
                  >
                    {validationResults.valid_cart_items.length > 0 
                      ? "Update Cart & Checkout" 
                      : "Update Cart"
                    }
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Cart;