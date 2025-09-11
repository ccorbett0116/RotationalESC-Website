from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'customer_email', 
            'customer_first_name', 'customer_last_name', 'customer_phone',
            'billing_address_line1', 'billing_address_line2', 'billing_city', 
            'billing_state', 'billing_postal_code', 'billing_country',
            'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
            'shipping_state', 'shipping_postal_code', 'shipping_country',
            'subtotal', 'tax_amount', 'total_amount',
            'payment_method', 'payment_status', 
            'stripe_payment_intent_id', 'stripe_payment_intent_client_secret', 'stripe_checkout_session_id',
            'confirmation_token', 'items', 'order_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order

class OrderCreateSerializer(serializers.ModelSerializer):
    order_items = serializers.ListField(
        child=serializers.DictField(), write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'customer_email', 'customer_first_name', 'customer_last_name', 
            'customer_phone', 'billing_address_line1', 'billing_address_line2', 
            'billing_city', 'billing_state', 'billing_postal_code', 'billing_country',
            'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
            'shipping_state', 'shipping_postal_code', 'shipping_country',
            'subtotal', 'tax_amount', 'total_amount', 'stripe_checkout_session_id',
            'payment_method', 'order_items'
        ]

    def validate(self, data):
        from products.models import Product
        
        order_items_data = data.get('order_items', [])
        
        for item_data in order_items_data:
            try:
                product = Product.objects.get(id=item_data.get('product_id'))
                
                # Check if product is available
                if not product.is_available:
                    raise serializers.ValidationError(
                        f'Product "{product.name}" is out of stock'
                    )
                
                # Check if requested quantity is available
                quantity = item_data.get('quantity', 0)
                if quantity > product.quantity:
                    raise serializers.ValidationError(
                        f'Only {product.quantity} units of "{product.name}" are available'
                    )
                
                # Use current product price instead of validating against frontend price
                # This prevents validation errors due to price sync issues
                from decimal import Decimal
                item_data['price'] = product.price
                    
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f'Product with id {item_data.get("product_id")} not found'
                )
        
        return data

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order
