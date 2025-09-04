from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
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
            'items', 'order_items', 'created_at', 'updated_at'
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
            'subtotal', 'tax_amount', 'total_amount',
            'payment_method', 'order_items'
        ]

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order
