from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from .stripe_service import StripeService
from .email_service import OrderEmailService
from products.models import Product
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        print(">>> Incoming /api/orders/)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():

            # Check if this is a card payment
            payment_method = request.data.get('payment_method', '')

            if payment_method == 'card':
                try:
                    # Create Stripe payment intent
                    order_items = request.data.get('order_items', [])

                    stripe_response = StripeService.create_payment_intent(
                        request.data,
                        order_items
                    )

                    # Save the order with Stripe payment intent details
                    order = serializer.save(
                        stripe_payment_intent_id=stripe_response['payment_intent_id'],
                        stripe_payment_intent_client_secret=stripe_response['client_secret']
                    )

                    # Return order data with Stripe client secret
                    response_serializer = OrderSerializer(order, context={'request': request})
                    response_data = response_serializer.data
                    response_data['stripe_client_secret'] = stripe_response['client_secret']
                    response_data['stripe_payment_intent_id'] = stripe_response['payment_intent_id']

                    return Response(response_data, status=status.HTTP_201_CREATED)

                except Exception as e:
                    print(">>> ERROR in StripeService or order save:", str(e))
                    import traceback; traceback.print_exc()
                    return Response(
                        {'error': f'Payment processing failed: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # For non-card payments (e.g., purchase orders), create order normally
                order = serializer.save()
                print(f">>> Non-card order {order.order_number} created successfully")
                response_serializer = OrderSerializer(order, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        else:
            print(">>> Serializer validation failed with errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.prefetch_related('items__product')
    serializer_class = OrderSerializer
    lookup_field = 'order_number'

@api_view(['POST', 'OPTIONS'])
def calculate_order_total(request):
    """
    Calculate order totals based on cart items and return availability issues
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    cart_items = request.data.get('items', [])
    billing_country = request.data.get('billing_country', 'CA')
    subtotal = 0
    
    # Track issues with cart items
    unavailable_items = []
    quantity_issues = []
    price_issues = []
    valid_items = []
    
    for item in cart_items:
        try:
            product = Product.objects.get(id=item['product_id'])
            item_info = {
                'product_id': str(product.id),
                'product_name': product.name,
                'requested_quantity': item['quantity']
            }
            
            # Check if product is available (active and has stock)
            if not product.is_available:
                unavailable_items.append({
                    **item_info,
                    'reason': 'inactive' if not product.active else 'out_of_stock',
                    'available_quantity': product.quantity
                })
                continue
            
            # Check if requested quantity is available
            if item['quantity'] > product.quantity:
                quantity_issues.append({
                    **item_info,
                    'available_quantity': product.quantity,
                    'message': f'Only {product.quantity} units available'
                })
                continue
            
            # Check if price has changed
            if item.get('price') and item['price'] != product.price:
                price_issues.append({
                    **item_info,
                    'old_price': item['price'],
                    'current_price': product.price,
                    'message': 'Price has changed'
                })
                # Still include in calculation with current price
            
            # Item is valid - add to calculation
            item_total = product.price * item['quantity']
            subtotal += item_total
            valid_items.append({
                **item_info,
                'price': product.price,
                'total': item_total
            })
            
        except Product.DoesNotExist:
            unavailable_items.append({
                'product_id': item.get('product_id', 'unknown'),
                'product_name': 'Unknown Product',
                'requested_quantity': item.get('quantity', 0),
                'reason': 'not_found',
                'message': 'Product no longer exists'
            })
    
    # Calculate totals for valid items only
    tax_rate = Decimal('0.13')
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount
    
    # Determine response status and structure
    has_issues = bool(unavailable_items or quantity_issues)
    
    response_data = {
        'valid': not has_issues,
        'subtotal': subtotal,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'tax_rate': tax_rate,
        'billing_country': billing_country,
        'valid_items': valid_items,
        'issues': {
            'unavailable_items': unavailable_items,
            'quantity_issues': quantity_issues,
            'price_issues': price_issues
        }
    }
    
    # Return 400 if there are blocking issues, 200 with warnings otherwise
    status_code = status.HTTP_400_BAD_REQUEST if has_issues else status.HTTP_200_OK
    return Response(response_data, status=status_code)

@api_view(['POST', 'OPTIONS'])
def validate_cart(request):
    """
    Validate cart items and return cleaned cart with availability info
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    cart_items = request.data.get('items', [])
    
    # Track issues and valid items
    valid_cart_items = []
    removed_items = []
    updated_items = []
    
    for item in cart_items:
        try:
            product = Product.objects.get(id=item['product_id'])
            
            # Check if product is available
            if not product.is_available:
                removed_items.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'reason': 'inactive' if not product.active else 'out_of_stock',
                    'message': f'Removed: {product.name} is no longer available'
                })
                continue
            
            # Check if requested quantity needs adjustment
            original_quantity = item['quantity']
            adjusted_quantity = min(original_quantity, product.quantity)
            
            if adjusted_quantity == 0:
                removed_items.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'reason': 'out_of_stock',
                    'message': f'Removed: {product.name} is out of stock'
                })
                continue
            
            # Create cleaned cart item
            clean_item = {
                'product_id': str(product.id),
                'quantity': adjusted_quantity,
                'price': product.price,
                'product_name': product.name
            }
            
            valid_cart_items.append(clean_item)
            
            # Track if quantity was adjusted
            if adjusted_quantity != original_quantity:
                updated_items.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'original_quantity': original_quantity,
                    'adjusted_quantity': adjusted_quantity,
                    'message': f'Quantity reduced to {adjusted_quantity} (maximum available)'
                })
            
        except Product.DoesNotExist:
            removed_items.append({
                'product_id': item.get('product_id', 'unknown'),
                'product_name': 'Unknown Product',
                'reason': 'not_found',
                'message': 'Removed: Product no longer exists'
            })
    
    return Response({
        'valid_cart_items': valid_cart_items,
        'removed_items': removed_items,
        'updated_items': updated_items,
        'cart_changed': bool(removed_items or updated_items)
    })

@api_view(['POST'])
def confirm_payment(request, order_number):
    """
    Confirm payment for an order using Stripe payment intent
    """
    try:
        order = Order.objects.get(order_number=order_number)
        payment_intent_id = request.data.get('payment_intent_id')
        
        if not payment_intent_id:
            return Response(
                {'error': 'Payment intent ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify payment with Stripe
        payment_intent = StripeService.get_payment_intent(payment_intent_id)
        
        # Update order payment status
        order = StripeService.update_order_payment_status(order, payment_intent)
        
        # Send email notifications if payment was successful
        if payment_intent.status == 'succeeded':
            # Reduce product quantities
            for order_item in order.items.select_related('product').all():
                product = order_item.product
                if not product.reduce_quantity(order_item.quantity):
                    # If quantity reduction fails, log an error but don't stop the process
                    print(f"Warning: Could not reduce quantity for product {product.name} (ID: {product.id})")
            
            OrderEmailService.send_payment_success_notification(order)
            # Customer confirmation disabled for now
            # OrderEmailService.send_customer_order_confirmation(order)
        elif payment_intent.status in ['canceled', 'requires_payment_method']:
            # Payment failed or was cancelled
            failure_reason = getattr(payment_intent, 'cancellation_reason', 'Payment failed or cancelled')
            OrderEmailService.send_payment_failed_notification(order, failure_reason)
        
        # Return updated order
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Payment confirmation failed: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    """
    import stripe
    from django.conf import settings
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET if hasattr(settings, 'STRIPE_WEBHOOK_SECRET') else None
    
    if not endpoint_secret:
        # If no webhook secret is configured, skip signature verification (not recommended for production)
        try:
            event = stripe.Event.construct_from(request.data, stripe.api_key)
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        try:
            # Find the order by payment intent ID
            order = Order.objects.get(stripe_payment_intent_id=payment_intent['id'])
            order.payment_status = 'completed'
            order.status = 'processing'
            order.save()
            
            # Reduce product quantities
            for order_item in order.items.select_related('product').all():
                product = order_item.product
                if not product.reduce_quantity(order_item.quantity):
                    # If quantity reduction fails, log an error but don't stop the process
                    print(f"Warning: Could not reduce quantity for product {product.name} (ID: {product.id})")
            
            # Send email notification to owner about successful payment
            OrderEmailService.send_payment_success_notification(order)
            # Customer confirmation disabled for now
            # OrderEmailService.send_customer_order_confirmation(order)
            
        except Order.DoesNotExist:
            pass  # Order might not exist yet
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent['id'])
            order.payment_status = 'failed'
            order.save()
            
            # Send email notification to owner about failed payment
            failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Payment failed')
            OrderEmailService.send_payment_failed_notification(order, failure_reason)
            
        except Order.DoesNotExist:
            pass

    elif event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        try:
            # Find order by checkout session ID or order number in metadata
            order_number = session.get('metadata', {}).get('order_number')
            if order_number:
                order = Order.objects.get(order_number=order_number)
                if session.payment_status == 'paid':
                    order.payment_status = 'completed'
                    order.status = 'processing'
                    order.save()
                    
                    # Reduce product quantities
                    for order_item in order.items.select_related('product').all():
                        product = order_item.product
                        if not product.reduce_quantity(order_item.quantity):
                            # If quantity reduction fails, log an error but don't stop the process
                            print(f"Warning: Could not reduce quantity for product {product.name} (ID: {product.id})")
                    
                    # Send email notification to owner about successful payment
                    OrderEmailService.send_payment_success_notification(order)
                    # Customer confirmation disabled for now
                    # OrderEmailService.send_customer_order_confirmation(order)
                    
        except Order.DoesNotExist:
            pass

    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        
        try:
            order_number = session.get('metadata', {}).get('order_number')
            if order_number:
                order = Order.objects.get(order_number=order_number)
                order.payment_status = 'failed'
                order.save()
                
                # Send email notification to owner about expired session
                OrderEmailService.send_payment_failed_notification(order, "Payment session expired")
                    
        except Order.DoesNotExist:
            pass
    
    elif event['type'] == 'payment_intent.canceled':
        payment_intent = event['data']['object']
        
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent['id'])
            order.payment_status = 'failed'
            order.save()
            
            # Send email notification to owner about cancelled payment
            cancellation_reason = payment_intent.get('cancellation_reason', 'Payment cancelled')
            OrderEmailService.send_payment_failed_notification(order, f"Payment cancelled: {cancellation_reason}")
            
        except Order.DoesNotExist:
            pass
    
    return Response({'status': 'success'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def create_checkout_session(request, order_number):
    """Create a Stripe Checkout Session and attach it to the order."""
    try:
        order = Order.objects.get(order_number=order_number)
        # Expect order_items with name, price, quantity, product_id
        order_items_payload = request.data.get('order_items', [])
        if not order_items_payload:
            # Build from existing OrderItems if not provided
            order_items_payload = [
                {
                    'name': oi.product.name,
                    'price': oi.price,
                    'quantity': oi.quantity,
                    'product_id': oi.product.id,
                    'description': oi.product.description,
                }
                for oi in order.items.select_related('product').all()
            ]
        session = StripeService.create_checkout_session(order, order_items_payload)
        order.stripe_checkout_session_id = session.id
        order.save(update_fields=['stripe_checkout_session_id'])
        return Response({'checkout_session_id': session.id, 'url': session.url}, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_checkout_session(request, order_number):
    """Verify Stripe Checkout Session completion and update order status."""
    try:
        order = Order.objects.get(order_number=order_number)
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'Session ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the session with Stripe
        session = StripeService.get_checkout_session(session_id)
        
        # Check if session belongs to this order
        if session.metadata.get('order_number') != order_number:
            return Response(
                {'error': 'Session does not match order'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check session status and payment status
        if session.status == 'expired':
            order.payment_status = 'failed'
            order.save(update_fields=['payment_status'])
            return Response(
                {'error': 'Payment session expired', 'verified': False}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status based on session payment status
        if session.payment_status == 'paid':
            order.payment_status = 'completed'
            order.status = 'processing'
            order.save(update_fields=['payment_status', 'status'])
            verified = True
            
            # Reduce product quantities
            for order_item in order.items.select_related('product').all():
                product = order_item.product
                if not product.reduce_quantity(order_item.quantity):
                    # If quantity reduction fails, log an error but don't stop the process
                    print(f"Warning: Could not reduce quantity for product {product.name} (ID: {product.id})")
            
            # Send email notification to owner about successful payment
            OrderEmailService.send_payment_success_notification(order)
            # Customer confirmation disabled for now
            # OrderEmailService.send_customer_order_confirmation(order)
            
        elif session.payment_status == 'unpaid':
            order.payment_status = 'pending'
            order.save(update_fields=['payment_status'])
            verified = False
        else:
            order.payment_status = 'failed'
            order.save(update_fields=['payment_status'])
            verified = False
            
            # Send email notification to owner about failed payment
            OrderEmailService.send_payment_failed_notification(order, f"Payment verification failed - {session.payment_status}")
        
        # Return verification result
        serializer = OrderSerializer(order, context={'request': request})
        return Response({
            'verified': verified,
            'order': serializer.data,
            'payment_status': session.payment_status,
            'session_status': session.status
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Session verification failed: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
