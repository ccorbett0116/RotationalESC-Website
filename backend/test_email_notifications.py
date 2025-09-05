#!/usr/bin/env python3
"""
Test script to verify email notification functionality for orders
Run this from the backend directory: python test_email_notifications.py
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rotational_equipment.settings')
django.setup()

from orders.models import Order, OrderItem
from orders.email_service import OrderEmailService
from products.models import Product, Category, ProductSpecification
from decimal import Decimal

def create_test_order():
    """Create a test order with sample products for testing email notifications"""
    
    # Create test category if it doesn't exist
    category, created = Category.objects.get_or_create(
        name="Test Equipment",
        defaults={'description': 'Test category for email notifications'}
    )
    
    # Create test product if it doesn't exist
    product, created = Product.objects.get_or_create(
        name="Test Rotational Pump",
        defaults={
            'description': 'A high-quality test pump for industrial applications',
            'price': Decimal('1250.00'),
            'category': category,
            'in_stock': True,
            'tags': 'pump, industrial, test'
        }
    )
    
    # Add some specifications to the product
    ProductSpecification.objects.get_or_create(
        product=product,
        key="Flow Rate",
        defaults={'value': "500 GPM", 'order': 1}
    )
    
    ProductSpecification.objects.get_or_create(
        product=product,
        key="Pressure",
        defaults={'value': "150 PSI", 'order': 2}
    )
    
    ProductSpecification.objects.get_or_create(
        product=product,
        key="Material",
        defaults={'value': "Cast Iron", 'order': 3}
    )
    
    # Create test order
    order = Order.objects.create(
        customer_email="test@example.com",
        customer_first_name="John",
        customer_last_name="Doe",
        customer_phone="+1-555-123-4567",
        billing_address_line1="123 Test Street",
        billing_city="Test City",
        billing_state="Test State",
        billing_postal_code="12345",
        billing_country="CA",
        shipping_address_line1="123 Test Street",
        shipping_city="Test City",
        shipping_state="Test State",
        shipping_postal_code="12345",
        shipping_country="CA",
        subtotal=Decimal('2500.00'),
        tax_amount=Decimal('325.00'),
        total_amount=Decimal('2825.00'),
        payment_method="card",
        payment_status="completed",
        status="processing"
    )
    
    # Create order items
    OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2,
        price=Decimal('1250.00')
    )
    
    return order

def test_success_notification():
    """Test the payment success notification email"""
    print("Testing payment success notification...")
    
    order = create_test_order()
    order.payment_status = "completed"
    order.status = "processing"
    order.save()
    
    try:
        success = OrderEmailService.send_payment_success_notification(order)
        if success:
            print(f"✅ Success notification sent for order {order.order_number}")
        else:
            print(f"❌ Failed to send success notification for order {order.order_number}")
    except Exception as e:
        print(f"❌ Error sending success notification: {str(e)}")
    
    return order

def test_failure_notification(order):
    """Test the payment failure notification email"""
    print("Testing payment failure notification...")
    
    try:
        success = OrderEmailService.send_payment_failed_notification(order, "Customer cancelled payment")
        if success:
            print(f"✅ Failure notification sent for order {order.order_number}")
        else:
            print(f"❌ Failed to send failure notification for order {order.order_number}")
    except Exception as e:
        print(f"❌ Error sending failure notification: {str(e)}")

def test_customer_confirmation(order):
    """Test the customer confirmation email (currently disabled)"""
    print("Testing customer confirmation notification (DISABLED)...")
    
    print("ℹ️  Customer confirmation emails are currently disabled")
    print("   To enable, uncomment the calls in orders/views.py")
    
    # Uncomment below to test customer emails
    # try:
    #     success = OrderEmailService.send_customer_order_confirmation(order)
    #     if success:
    #         print(f"✅ Customer confirmation sent for order {order.order_number}")
    #     else:
    #         print(f"❌ Failed to send customer confirmation for order {order.order_number}")
    # except Exception as e:
    #     print(f"❌ Error sending customer confirmation: {str(e)}")

def main():
    """Run all email notification tests"""
    print("🧪 Testing Email Notification System")
    print("=" * 50)
    
    # Check if email settings are configured
    from django.conf import settings
    
    print(f"Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Email Host: {settings.EMAIL_HOST}")
    print(f"Email Port: {settings.EMAIL_PORT}")
    print(f"Email Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    print(f"Owner Email: {settings.OWNER_EMAIL}")
    print("-" * 50)
    
    if not settings.OWNER_EMAIL:
        print("❌ OWNER_EMAIL not configured in settings!")
        print("Please set OWNER_EMAIL in your environment variables.")
        return
    
    # Run tests
    order = test_success_notification()
    test_failure_notification(order)
    test_customer_confirmation(order)
    
    print("-" * 50)
    print("🎉 Email notification tests completed!")
    print(f"Check the inbox for {settings.OWNER_EMAIL} to see the notifications.")
    
    # Clean up test data
    cleanup = input("\nDo you want to delete the test order? (y/N): ")
    if cleanup.lower() == 'y':
        order.delete()
        print("Test order deleted.")

if __name__ == "__main__":
    main()
