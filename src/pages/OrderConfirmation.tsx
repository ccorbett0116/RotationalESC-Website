import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Package, Truck, CreditCard, ArrowLeft, Download, Mail, Phone } from "lucide-react";
import { apiService, Order } from "@/services/api";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { formatCAD } from "@/lib/currency";
import Layout from "@/components/Layout";
import Image from "@/components/Image";

const OrderConfirmation = () => {
  const { token } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: companyInfo } = useCompanyInfo();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const orderData = await apiService.getOrderByToken(token);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error instanceof Error ? error.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  const handleDownloadReceipt = () => {
    if (!order) return;

    // Create a new window with the receipt content
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHTML = generateReceiptHTML(order);
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    
    // Wait for content to load, then print
    receiptWindow.onload = () => {
      receiptWindow.print();
      receiptWindow.close();
    };
  };

  const generateReceiptHTML = (order: Order) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .order-info { margin-bottom: 30px; }
            .order-info h2 { margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; }
            .totals table { width: 300px; margin-left: auto; }
            .totals td { padding: 5px 10px; }
            .total-row { font-weight: bold; border-top: 2px solid #333; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyInfo?.name || 'Rotational Equipment Services'}</div>
            <div>Receipt</div>
          </div>
          
          <div class="order-info">
            <h2>Order #${order.order_number}</h2>
            <div class="info-grid">
              <div>
                <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
                <strong>Customer:</strong> ${order.customer_first_name} ${order.customer_last_name}<br>
                <strong>Email:</strong> ${order.customer_email}<br>
                <strong>Payment Method:</strong> ${order.payment_method === 'card' ? 'Stripe' : 'Purchase Order'}
              </div>
              <div>
                <strong>Shipping Address:</strong><br>
                ${order.shipping_address_line1}<br>
                ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
                ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
                ${order.shipping_country}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCAD(Number(item.price))}</td>
                  <td>${formatCAD(Number(item.total_price))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>${formatCAD(Number(order.subtotal))}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>Will be contacted for shipping</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>${formatCAD(Number(order.tax_amount))}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td><strong>${formatCAD(Number(order.total_amount))}</strong></td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>For questions about this order, please contact us with your order number.</p>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading order details...</div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error ? 'Access Denied' : 'Order Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't find an order with that identifier."}
            </p>
            <Link to="/shop">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }[order.status] || 'bg-gray-100 text-gray-800';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your order has been received and is being processed.
          </p>
        </div>

        {/* Order Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order #{order.order_number}</span>
              <Badge className={statusColor}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Date</h3>
                <p className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">{order.customer_email}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <p className="text-muted-foreground">
                  {order.payment_method === 'card' ? 'Stripe' : 'Purchase Order'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                        {item.product.primary_image ? (
                          <Image
                            src={item.product.primary_image}
                            alt={item.product.name}
                            className="w-full h-full"
                            aspectRatio="1/1"
                            objectFit="cover"
                            lazy={true}
                            placeholder="skeleton"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCAD(Number(item.price))} each
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCAD(Number(item.total_price))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCAD(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Will be contacted for shipping</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCAD(Number(order.tax_amount))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCAD(Number(order.total_amount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p>{order.customer_first_name} {order.customer_last_name}</p>
                <p>{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && (
                  <p>{order.shipping_address_line2}</p>
                )}
                <p>
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Will be contacted via Email or your Number for shipping
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadReceipt}>
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          <Link to="/shop">
            <Button>Continue Shopping</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>

        {/* What's Next */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Order Processing</h4>
                <p className="text-sm text-muted-foreground">
                  We're preparing your items for shipment
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Shipping</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email to discuss shipping details
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Your equipment will arrive promptly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
