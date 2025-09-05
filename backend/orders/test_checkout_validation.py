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

class CartValidationTestCase(TestCase):
    """Test cart validation and cleanup functionality"""
    
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

    def test_calculate_order_total_detailed_response(self):
        """Test that calculate_order_total returns detailed availability info"""
        from orders.views import calculate_order_total
        from django.test import RequestFactory
        import json
        
        factory = RequestFactory()
        data = {
            'items': [
                {
                    'product_id': str(self.active_product.id),
                    'quantity': 2,
                    'price': float(self.active_product.price)
                },
                {
                    'product_id': str(self.inactive_product.id),
                    'quantity': 1
                },
                {
                    'product_id': str(self.out_of_stock_product.id),
                    'quantity': 1
                }
            ],
            'billing_country': 'CA'
        }
        request = factory.post('/calculate/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = calculate_order_total(request)
        
        # Should return 400 because of issues
        self.assertEqual(response.status_code, 400)
        
        # Check response structure
        self.assertFalse(response.data['valid'])
        self.assertEqual(len(response.data['valid_items']), 1)  # Only active product
        self.assertEqual(len(response.data['issues']['unavailable_items']), 2)  # Inactive and out of stock
        
        # Check that totals are calculated for valid items only
        expected_subtotal = self.active_product.price * 2
        self.assertEqual(response.data['subtotal'], expected_subtotal)

    def test_validate_cart_endpoint(self):
        """Test the validate_cart endpoint for cart cleanup"""
        from orders.views import validate_cart
        from django.test import RequestFactory
        import json
        
        factory = RequestFactory()
        data = {
            'items': [
                {
                    'product_id': str(self.active_product.id),
                    'quantity': 10,  # More than available
                },
                {
                    'product_id': str(self.inactive_product.id),
                    'quantity': 1
                },
                {
                    'product_id': str(self.out_of_stock_product.id),
                    'quantity': 1
                },
                {
                    'product_id': '00000000-0000-0000-0000-000000000000',  # Non-existent
                    'quantity': 1
                }
            ]
        }
        request = factory.post('/validate/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = validate_cart(request)
        
        # Should return 200 with cleaned cart
        self.assertEqual(response.status_code, 200)
        
        # Check that cart was cleaned
        self.assertTrue(response.data['cart_changed'])
        
        # Should have 1 valid item (active product with adjusted quantity)
        self.assertEqual(len(response.data['valid_cart_items']), 1)
        valid_item = response.data['valid_cart_items'][0]
        self.assertEqual(valid_item['quantity'], 5)  # Adjusted to max available
        
        # Should have 3 removed items (inactive, out of stock, non-existent)
        self.assertEqual(len(response.data['removed_items']), 3)
        
        # Should have 1 updated item (quantity adjusted)
        self.assertEqual(len(response.data['updated_items']), 1)
        updated_item = response.data['updated_items'][0]
        self.assertEqual(updated_item['original_quantity'], 10)
        self.assertEqual(updated_item['adjusted_quantity'], 5)

    def test_validate_cart_with_valid_items(self):
        """Test validate_cart with all valid items"""
        from orders.views import validate_cart
        from django.test import RequestFactory
        import json
        
        factory = RequestFactory()
        data = {
            'items': [
                {
                    'product_id': str(self.active_product.id),
                    'quantity': 3,  # Within available quantity
                }
            ]
        }
        request = factory.post('/validate/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = validate_cart(request)
        
        # Should return 200 with no changes needed
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['cart_changed'])
        self.assertEqual(len(response.data['valid_cart_items']), 1)
        self.assertEqual(len(response.data['removed_items']), 0)
        self.assertEqual(len(response.data['updated_items']), 0)