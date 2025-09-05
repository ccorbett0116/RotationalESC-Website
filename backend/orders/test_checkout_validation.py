from django.test import TestCase
from rest_framework.exceptions import ValidationError
from decimal import Decimal
from products.models import Category, Product
from .serializers import OrderCreateSerializer

class CheckoutValidationTestCase(TestCase):
    """Test checkout validation across all endpoints"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.active_product = Product.objects.create(
            name="Active Product",
            description="Test Description",
            price=Decimal('100.00'),
            category=self.category,
            quantity=5,
            active=True
        )
        
        self.inactive_product = Product.objects.create(
            name="Inactive Product",
            description="Test Description", 
            price=Decimal('75.00'),
            category=self.category,
            quantity=10,
            active=False
        )
        
        self.out_of_stock_product = Product.objects.create(
            name="Out of Stock Product",
            description="Test Description",
            price=Decimal('50.00'),
            category=self.category,
            quantity=0
        )

    def test_product_availability_validation(self):
        """Test that product availability validation is properly implemented"""
        # Test that inactive product is not available
        self.assertFalse(self.inactive_product.is_available)
        
        # Test that out of stock product is not available  
        self.assertFalse(self.out_of_stock_product.is_available)
        
        # Test that active product with quantity is available
        self.assertTrue(self.active_product.is_available)

    def test_stripe_payment_intent_validates_product_availability(self):
        """Test that Stripe payment intent creation validates product availability"""
        from orders.stripe_service import StripeService
        
        order_data = {
            'customer_email': 'test@example.com',
            'customer_first_name': 'Test',
            'customer_last_name': 'User',
            'total_amount': Decimal('75.00')
        }
        
        order_items = [
            {
                'product_id': str(self.inactive_product.id),
                'quantity': 1,
                'price': self.inactive_product.price
            }
        ]
        
        with self.assertRaises(Exception) as context:
            StripeService.create_payment_intent(order_data, order_items)
        
        self.assertIn('no longer available', str(context.exception))

    def test_stripe_payment_intent_validates_quantity(self):
        """Test that Stripe payment intent creation validates quantity availability"""
        from orders.stripe_service import StripeService
        
        order_data = {
            'customer_email': 'test@example.com',
            'customer_first_name': 'Test',
            'customer_last_name': 'User', 
            'total_amount': Decimal('1000.00')
        }
        
        order_items = [
            {
                'product_id': str(self.active_product.id),
                'quantity': 10,  # More than available
                'price': self.active_product.price
            }
        ]
        
        with self.assertRaises(Exception) as context:
            StripeService.create_payment_intent(order_data, order_items)
        
        self.assertIn('available', str(context.exception))

    def test_stripe_payment_intent_validates_price(self):
        """Test that Stripe payment intent creation validates price changes"""
        from orders.stripe_service import StripeService
        
        order_data = {
            'customer_email': 'test@example.com',
            'customer_first_name': 'Test',
            'customer_last_name': 'User',
            'total_amount': Decimal('50.00')
        }
        
        order_items = [
            {
                'product_id': str(self.active_product.id),
                'quantity': 1,
                'price': Decimal('50.00')  # Different from actual price
            }
        ]
        
        with self.assertRaises(Exception) as context:
            StripeService.create_payment_intent(order_data, order_items)
        
        self.assertIn('changed', str(context.exception))