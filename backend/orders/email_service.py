from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from decimal import Decimal
import logging
from company.models import CompanyInfo

logger = logging.getLogger(__name__)

class OrderEmailService:
    """Service to handle order-related email notifications"""
    
    @staticmethod
    def send_payment_success_notification(order):
        """
        Send email notification to owner when payment is successful
        """
        try:
            # Get order items with product details and specifications
            order_items = order.items.select_related('product', 'product__category').all()
            
            # Prepare order items data with specifications
            items_data = []
            for item in order_items:
                item_data = {
                    'name': item.product.name,
                    'category': item.product.category.name if item.product.category else 'Uncategorized',
                    'quantity': item.quantity,
                    'price': item.price,
                    'total': item.total_price,
                    'description': item.product.description,
                    'specifications': []
                }
                
                # Get product specifications
                specifications = item.product.specifications.all()
                for spec in specifications:
                    item_data['specifications'].append({
                        'name': spec.key,
                        'value': spec.value,
                        'unit': ''  # ProductSpecification doesn't have unit field
                    })
                
                items_data.append(item_data)
            
            # Calculate totals
            items_total = sum(item['total'] for item in items_data)
            
            # Prepare email content
            subject = f"🎉 New Order Received - Order #{order.order_number}"
            
            # Create detailed email body
            email_body = f"""
NEW ORDER NOTIFICATION - PAYMENT SUCCESSFUL
==========================================

Order Details:
--------------
Order Number: {order.order_number}
Order Date: {order.created_at.strftime('%B %d, %Y at %I:%M %p')}
Payment Status: {order.payment_status.title()}
Order Status: {order.status.title()}

Customer Information:
--------------------
Name: {order.customer_first_name} {order.customer_last_name}
Email: {order.customer_email}
Phone: {order.customer_phone or 'Not provided'}

Billing Address:
---------------
{order.billing_address_line1}
{order.billing_address_line2 + ', ' if order.billing_address_line2 else ''}{order.billing_city}, {order.billing_state} {order.billing_postal_code}
{dict(order.COUNTRY_CHOICES).get(order.billing_country, order.billing_country)}

Shipping Address:
----------------
{order.shipping_address_line1}
{order.shipping_address_line2 + ', ' if order.shipping_address_line2 else ''}{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
{dict(order.COUNTRY_CHOICES).get(order.shipping_country, order.shipping_country)}

ORDER ITEMS:
===========
"""
            
            # Add each item with specifications
            for i, item in enumerate(items_data, 1):
                email_body += f"""
Item #{i}: {item['name']}
Category: {item['category']}
Quantity: {item['quantity']}
Unit Price: ${item['price']:.2f} CAD
Total: ${item['total']:.2f} CAD

Description: {item['description'] or 'No description available'}

Specifications:
"""
                if item['specifications']:
                    for spec in item['specifications']:
                        email_body += f"  • {spec['name']}: {spec['value']}\n"
                else:
                    email_body += "  • No specifications available\n"
                
                email_body += "\n" + "-" * 50 + "\n"
            
            # Add totals
            email_body += f"""
ORDER SUMMARY:
=============
Subtotal: ${order.subtotal:.2f} CAD
Tax: ${order.tax_amount:.2f} CAD
TOTAL: ${order.total_amount:.2f} CAD

Payment Method: {order.payment_method.title()}
Payment Status: {order.payment_status.title()}

NEXT STEPS:
==========
1. Review the order details above
2. Prepare and package the items
3. Contact customer for shipping arrangements
4. Update order status in admin panel

Customer Contact: {order.customer_email}
Customer Phone: {order.customer_phone or 'Not provided'}

You can view the full order details in the admin panel.
            """
            
            # Send email to owner
            send_mail(
                subject=subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.OWNER_EMAIL],
                fail_silently=False,
            )
            
            logger.info(f"Payment success notification sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment success notification for order {order.order_number}: {str(e)}")
            return False
    
    @staticmethod
    def send_payment_failed_notification(order, reason="Unknown"):
        """
        Send email notification to owner when payment fails or is cancelled
        """
        try:
            # Get order items for context
            order_items = order.items.select_related('product', 'product__category').all()
            
            # Prepare basic order items data
            items_summary = []
            for item in order_items:
                items_summary.append(f"• {item.product.name} x{item.quantity} - ${item.price:.2f} CAD")
            
            # Determine notification type based on reason
            if 'cancel' in reason.lower():
                action_type = "CANCELLED"
                emoji = "🚫"
            elif 'expired' in reason.lower():
                action_type = "EXPIRED"
                emoji = "⏰"
            else:
                action_type = "FAILED"
                emoji = "❌"
            
            subject = f"{emoji} Order Payment {action_type} - Order #{order.order_number}"
            
            email_body = f"""
ORDER PAYMENT {action_type} NOTIFICATION
{'=' * 40}

Order Details:
--------------
Order Number: {order.order_number}
Order Date: {order.created_at.strftime('%B %d, %Y at %I:%M %p')}
Payment Status: {order.payment_status.title()}
Failure Reason: {reason}

Customer Information:
--------------------
Name: {order.customer_first_name} {order.customer_last_name}
Email: {order.customer_email}
Phone: {order.customer_phone or 'Not provided'}

Items in Order:
--------------
{chr(10).join(items_summary)}

Order Total: ${order.total_amount:.2f} CAD

NEXT STEPS:
==========
"""
            
            if 'cancel' in reason.lower():
                email_body += """1. Customer cancelled the payment - they may contact you directly
2. Order is saved and customer can retry payment later
3. Consider following up if this was a high-value order
4. No immediate action required unless customer contacts you"""
            elif 'expired' in reason.lower():
                email_body += """1. Payment session expired - customer didn't complete payment in time
2. Customer may retry or contact you for assistance
3. Consider following up for high-value orders
4. Order remains in system for future payment attempts"""
            else:
                email_body += """1. Payment failed - could be insufficient funds, card declined, etc.
2. Customer may retry with different payment method
3. Consider contacting customer if they need assistance
4. Order remains in system for future payment attempts"""
            
            email_body += f"""

Customer Contact: {order.customer_email}
Customer Phone: {order.customer_phone or 'Not provided'}

You can view the order details in the admin panel.
            """
            
            # Send email to owner
            send_mail(
                subject=subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.OWNER_EMAIL],
                fail_silently=False,
            )
            
            logger.info(f"Payment {action_type.lower()} notification sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment {action_type.lower()} notification for order {order.order_number}: {str(e)}")
            return False
    
    @staticmethod
    def send_customer_order_confirmation(order):
        """
        Send order confirmation email to customer (optional - for successful payments)
        """
        try:
            subject = f"Order Confirmation - Order #{order.order_number}"
            
            # Get order items
            order_items = order.items.select_related('product').all()
            items_list = []
            for item in order_items:
                items_list.append(f"• {item.product.name} x{item.quantity} - ${item.total_price:.2f} CAD")
            
            # Get company info for email
            try:
                company_info = CompanyInfo.objects.first()
                company_name = company_info.name if company_info else "Rotational Equipment Services"
            except CompanyInfo.DoesNotExist:
                company_name = "Rotational Equipment Services"
            
            email_body = f"""
Dear {order.customer_first_name} {order.customer_last_name},

Thank you for your order! We have successfully received your payment and are processing your order.

Order Details:
--------------
Order Number: {order.order_number}
Order Date: {order.created_at.strftime('%B %d, %Y')}

Items Ordered:
{chr(10).join(items_list)}

Order Total: ${order.total_amount:.2f} CAD

We will contact you shortly regarding shipping arrangements and delivery details.

If you have any questions about your order, please don't hesitate to contact us.

Best regards,
{company_name} Team

Phone: [Your phone number]
Email: {settings.DEFAULT_FROM_EMAIL}
            """
            
            send_mail(
                subject=subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.customer_email],
                fail_silently=True,  # Don't fail if customer email fails
            )
            
            logger.info(f"Customer confirmation sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send customer confirmation for order {order.order_number}: {str(e)}")
            return False
