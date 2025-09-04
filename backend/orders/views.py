from decimal import Decimal
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
    billing_country = request.data.get('billing_country', 'US')
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
    
    tax_rate = Decimal('0.13')
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount
    
    return Response({
        'subtotal': subtotal,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'tax_rate': tax_rate,
        'billing_country': billing_country
    })
