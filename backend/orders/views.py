from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from products.models import Product

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            
            # Return the created order with full details
            response_serializer = OrderSerializer(order, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.prefetch_related('items__product')
    serializer_class = OrderSerializer
    lookup_field = 'order_number'

@api_view(['POST'])
def calculate_order_total(request):
    """
    Calculate order totals based on cart items
    """
    cart_items = request.data.get('items', [])
    subtotal = 0
    
    for item in cart_items:
        try:
            product = Product.objects.get(id=item['product_id'])
            item_total = product.price * item['quantity']
            subtotal += item_total
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with id {item["product_id"]} not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Calculate tax (10%)
    tax_rate = 0.10
    tax_amount = subtotal * tax_rate
    
    # Calculate shipping
    shipping_method = request.data.get('shipping_method', 'standard')
    if shipping_method == 'express':
        shipping_amount = 250.00
    elif subtotal > 5000:
        shipping_amount = 0.00  # Free shipping over $5000
    else:
        shipping_amount = 150.00
    
    total_amount = subtotal + tax_amount + shipping_amount
    
    return Response({
        'subtotal': subtotal,
        'tax_amount': tax_amount,
        'shipping_amount': shipping_amount,
        'total_amount': total_amount
    })
