import stripe
from django.conf import settings
from decimal import Decimal
from .models import Order

# Configure Stripe with the secret key
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    def create_payment_intent(order_data, order_items):
        """
        Create a Stripe payment intent for the order
        """
        try:
            # Calculate the total amount in cents (Stripe requires cents)
            total_amount_cents = int(order_data['total_amount'] * 100)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=total_amount_cents,
                currency='usd',  # You can make this configurable based on billing_country
                metadata={
                    'customer_email': order_data['customer_email'],
                    'customer_name': f"{order_data['customer_first_name']} {order_data['customer_last_name']}",
                    'order_items_count': len(order_items),
                },
                description=f"Order for {order_data['customer_email']}",
                receipt_email=order_data['customer_email'],
                shipping={
                    'name': f"{order_data['customer_first_name']} {order_data['customer_last_name']}",
                    'address': {
                        'line1': order_data['shipping_address_line1'],
                        'line2': order_data.get('shipping_address_line2', ''),
                        'city': order_data['shipping_city'],
                        'state': order_data['shipping_state'],
                        'postal_code': order_data['shipping_postal_code'],
                        'country': order_data['shipping_country'],
                    },
                },
            )
            
            return {
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': intent.amount,
                'currency': intent.currency,
                'status': intent.status,
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Payment processing error: {str(e)}")
    
    @staticmethod
    def confirm_payment(payment_intent_id):
        """
        Confirm a payment intent (usually done on the frontend, but can be used for verification)
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'status': intent.status,
                'amount_received': intent.amount_received,
                'payment_method': intent.payment_method,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def get_payment_intent(payment_intent_id):
        """
        Retrieve a payment intent from Stripe
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return intent
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def update_order_payment_status(order, payment_intent):
        """
        Update order payment status based on Stripe payment intent
        """
        status_mapping = {
            'succeeded': 'completed',
            'processing': 'processing',
            'requires_payment_method': 'pending',
            'requires_confirmation': 'pending',
            'requires_action': 'pending',
            'canceled': 'failed',
        }
        
        order.payment_status = status_mapping.get(payment_intent.status, 'pending')
        
        # Update order status if payment is successful
        if payment_intent.status == 'succeeded':
            order.status = 'processing'  # Move to processing after successful payment
        
        order.save()
        return order
    
    @staticmethod
    def create_checkout_session(order, order_items):
        """Create a Stripe Checkout Session for hosted checkout."""
        try:
            line_items = []
            for item in order_items:
                # item expected keys: product_id, quantity, price
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': item.get('name', 'Product'),
                        },
                        'unit_amount': int(Decimal(str(item['price'])) * 100),
                    },
                    'quantity': item['quantity'],
                })

            session = stripe.checkout.Session.create(
                mode='payment',
                payment_method_types=['card'],
                line_items=line_items,
                customer_email=order.customer_email,
                metadata={'order_number': order.order_number},
                success_url=settings.STRIPE_SUCCESS_URL + f'?session_id={{CHECKOUT_SESSION_ID}}&order={order.order_number}',
                cancel_url=settings.STRIPE_CANCEL_URL + f'?order={order.order_number}',
            )
            return session
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Checkout session error: {str(e)}")
