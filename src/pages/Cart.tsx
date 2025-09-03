import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle } from "lucide-react";
import { apiService, Product } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const Cart = () => {
  const { items: cartItems, updateQuantity: updateCartQuantity, removeItem: removeCartItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState<number[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiService.getProducts();
        setProducts(response.results);
        
        // Check for items in cart that no longer exist
        const existingProductIds = new Set(response.results.map(p => p.id));
        const missingItems = cartItems.filter(item => !existingProductIds.has(item.productId));
        
        if (missingItems.length > 0) {
          setRemovedItems(missingItems.map(item => item.productId));
          // Show notification about removed items
          toast({
            title: "Items removed from cart",
            description: `${missingItems.length} item(s) no longer available and were removed from your cart`,
            variant: "destructive",
          });
          // Auto-remove missing items from cart
          missingItems.forEach(item => removeCartItem(item.productId));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cartItems, removeCartItem]);

  const updateQuantity = (productId: number, newQuantity: number) => {
    updateCartQuantity(productId, newQuantity);
  };

  const removeItem = (productId: number) => {
    removeCartItem(productId);
  };

  // Get product details for cart items, filter out items that don't exist
  const cartWithDetails = cartItems
    .map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId)
    }))
    .filter(item => item.product !== undefined) as Array<{
      productId: number;
      quantity: number;
      product: Product;
    }>;

  const subtotal = cartWithDetails.reduce(
    (sum, item) => sum + (Number(item.product.price) * item.quantity),
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 5000 ? 0 : 150; // Free shipping over $5000
  const total = subtotal + tax + shipping;

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
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        {removedItems.length > 0 && (
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
                          <Badge variant="outline" className="mt-1">
                            {item.product.category.name}
                          </Badge>
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
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            ${(Number(item.product.price) * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Number(item.product.price).toFixed(2)} each
                          </div>
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {shipping === 0 && (
                  <div className="text-sm text-green-600">
                    🎉 You qualify for free shipping!
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Link to="/checkout" className="block">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>

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
      </div>
    </Layout>
  );
};

export default Cart;