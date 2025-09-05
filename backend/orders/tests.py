from django.test import TestCase
from rest_framework.exceptions import ValidationError
from decimal import Decimal
from products.models import Category, Product
from .serializers import OrderCreateSerializer

class OrderInventoryValidationTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            description="Test Description",
            price=Decimal('100.00'),
            category=self.category,
            quantity=5,
            in_stock=True
        )
        
        self.out_of_stock_product = Product.objects.create(
            name="Out of Stock Product",
            description="Test Description",
            price=Decimal('50.00'),
            category=self.category,
            quantity=0,
            in_stock=False
        )
        
        self.base_order_data = {
            'customer_email': 'test@example.com',
            'customer_first_name': 'Test',
            'customer_last_name': 'User',
            'billing_address_line1': '123 Test St',
            'billing_city': 'Test City',
            'billing_state': 'Test State',
            'billing_postal_code': '12345',
            'billing_country': 'US',
            'shipping_address_line1': '123 Test St',
            'shipping_city': 'Test City',
            'shipping_state': 'Test State',
            'shipping_postal_code': '12345',
            'shipping_country': 'US',
            'subtotal': Decimal('100.00'),
            'tax_amount': Decimal('13.00'),
            'total_amount': Decimal('113.00'),
            'payment_method': 'card'
        }

    def test_valid_order_creation(self):
        """Test that valid order data passes validation"""
        order_data = self.base_order_data.copy()
        order_data['order_items'] = [
            {
                'product_id': str(self.product.id),
                'quantity': 2,
                'price': self.product.price
            }
        ]
        
        serializer = OrderCreateSerializer(data=order_data)
        self.assertTrue(serializer.is_valid())

    def test_out_of_stock_product_validation(self):
        """Test that out of stock products are rejected"""
        order_data = self.base_order_data.copy()
        order_data['order_items'] = [
            {
                'product_id': str(self.out_of_stock_product.id),
                'quantity': 1,
                'price': self.out_of_stock_product.price
            }
        ]
        
        serializer = OrderCreateSerializer(data=order_data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        
        self.assertIn('out of stock', str(context.exception))

    def test_insufficient_quantity_validation(self):
        """Test that orders with insufficient quantity are rejected"""
        order_data = self.base_order_data.copy()
        order_data['order_items'] = [
            {
                'product_id': str(self.product.id),
                'quantity': 10,  # More than available (5)
                'price': self.product.price
            }
        ]
        
        serializer = OrderCreateSerializer(data=order_data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        
        self.assertIn('available', str(context.exception))

    def test_price_mismatch_validation(self):
        """Test that orders with incorrect prices are rejected"""
        order_data = self.base_order_data.copy()
        order_data['order_items'] = [
            {
                'product_id': str(self.product.id),
                'quantity': 2,
                'price': Decimal('50.00')  # Different from product price
            }
        ]
        
        serializer = OrderCreateSerializer(data=order_data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        
        self.assertIn('price', str(context.exception).lower())

    def test_nonexistent_product_validation(self):
        """Test that orders with non-existent products are rejected"""
        order_data = self.base_order_data.copy()
        order_data['order_items'] = [
            {
                'product_id': '00000000-0000-0000-0000-000000000000',
                'quantity': 1,
                'price': Decimal('100.00')
            }
        ]
        
        serializer = OrderCreateSerializer(data=order_data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        
        self.assertIn('not found', str(context.exception))
