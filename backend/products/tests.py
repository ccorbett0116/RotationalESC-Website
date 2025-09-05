from django.test import TestCase
from .models import Category, Product

class ProductInventoryTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            description="Test Description",
            price=100.00,
            category=self.category,
            quantity=10,
            in_stock=True
        )

    def test_product_is_available_when_in_stock_and_has_quantity(self):
        """Test that product is available when in_stock=True and quantity > 0"""
        self.assertTrue(self.product.is_available)

    def test_product_not_available_when_not_in_stock(self):
        """Test that product is not available when in_stock=False"""
        self.product.in_stock = False
        self.product.save()
        self.assertFalse(self.product.is_available)

    def test_product_not_available_when_quantity_zero(self):
        """Test that product is not available when quantity=0"""
        self.product.quantity = 0
        self.product.save()
        self.assertFalse(self.product.is_available)

    def test_reduce_quantity_success(self):
        """Test successful quantity reduction"""
        initial_quantity = self.product.quantity
        result = self.product.reduce_quantity(3)
        self.assertTrue(result)
        self.assertEqual(self.product.quantity, initial_quantity - 3)

    def test_reduce_quantity_insufficient_stock(self):
        """Test quantity reduction fails when insufficient stock"""
        result = self.product.reduce_quantity(15)  # More than available
        self.assertFalse(result)
        self.assertEqual(self.product.quantity, 10)  # Should remain unchanged

    def test_reduce_quantity_to_zero_marks_out_of_stock(self):
        """Test that reducing quantity to zero marks product as out of stock"""
        self.product.reduce_quantity(10)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0)
        self.assertFalse(self.product.in_stock)
        self.assertFalse(self.product.is_available)

    def test_product_not_available_when_inactive(self):
        """Test that product is not available when active=False"""
        self.product.active = False
        self.product.save()
        self.assertFalse(self.product.is_available)

    def test_inactive_product_with_stock_not_available(self):
        """Test that inactive product with stock and quantity is still not available"""
        self.product.active = False
        self.product.in_stock = True
        self.product.quantity = 5
        self.product.save()
        self.assertFalse(self.product.is_available)

    def test_active_product_is_available(self):
        """Test that active product with stock and quantity is available"""
        self.product.active = True
        self.product.in_stock = True
        self.product.quantity = 5
        self.product.save()
        self.assertTrue(self.product.is_available)
