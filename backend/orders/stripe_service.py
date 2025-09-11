import stripe
from django.conf import settings
from decimal import Decimal
from .models import Order

# Configure Stripe with the secret key
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    def create_or_get_stripe_product(product):
        """
        Create or retrieve a Stripe product for better tracking in Stripe dashboard
        """
        try:
            # Check if product already exists in Stripe by searching metadata
            existing_products = stripe.Product.list(
                metadata={'internal_product_id': str(product.id)}
            )
            
            if existing_products.data:
                return existing_products.data[0]
            
            # Create new Stripe product
            stripe_product = stripe.Product.create(
                name=product.name,
                description=product.description[:500] if product.description else None,  # Stripe limits description
                metadata={
                    'internal_product_id': str(product.id),
                    'category': product.category.name if product.category else 'Unknown',
                    'tags': product.tags[:500] if product.tags else '',  # Stripe metadata value limit
                }
            )
            
            return stripe_product
            
        except stripe.error.StripeError as e:
            # If Stripe product creation fails, we'll continue without it
            # This ensures the payment process doesn't break
            print(f"Warning: Could not create Stripe product for {product.name}: {str(e)}")
            return None

    @staticmethod
    def create_stripe_price(stripe_product, price_amount):
        """
        Create a Stripe price for a product
        """
        try:
            stripe_price = stripe.Price.create(
                product=stripe_product.id,
                unit_amount=int(price_amount * 100),  # Convert to cents
                currency='cad',
            )
            return stripe_price
        except stripe.error.StripeError as e:
            print(f"Warning: Could not create Stripe price: {str(e)}")
            return None

    @staticmethod
    def create_payment_intent(order_data, order_items):
        """
        Create a Stripe payment intent for the order
        """
        try:
            from products.models import Product
            
            # Calculate the total amount in cents (Stripe requires cents)
            total_amount_cents = int(order_data['total_amount'] * 100)
            
            # Build detailed metadata with product information
            metadata = {
                'customer_email': order_data['customer_email'],
                'customer_name': f"{order_data['customer_first_name']} {order_data['customer_last_name']}",
                'order_items_count': len(order_items),
                'subtotal': str(order_data.get('subtotal', 0)),
                'tax_amount': str(order_data.get('tax_amount', 0)),
                'total_amount': str(order_data['total_amount']),
                'billing_country': order_data.get('billing_country', 'CA'),
                'custom_tax_applied': 'true',  # Flag to indicate we're using custom tax calculation
            }
            
            # Add individual product details to metadata AND validate availability
            for i, item in enumerate(order_items):
                try:
                    product = Product.objects.get(id=item['product_id'])
                    
                    # Validate product availability before creating payment intent
                    if not product.is_available:
                        raise Exception(f'Product "{product.name}" is no longer available')
                    
                    # Validate quantity availability
                    if item['quantity'] > product.quantity:
                        raise Exception(f'Only {product.quantity} units of "{product.name}" are available')
                    
                    # Validate price hasn't changed
                    from decimal import Decimal
                    try:
                        frontend_price = Decimal(str(item['price']))
                    except Exception:
                        frontend_price = None  # fallback if missing/invalid
                    if frontend_price != product.price:
                        raise Exception(f'Price for "{product.name}" has changed. Please refresh your cart.')
                    
                    metadata[f'item_{i+1}_name'] = product.name
                    metadata[f'item_{i+1}_id'] = str(product.id)
                    metadata[f'item_{i+1}_category'] = product.category.name
                    metadata[f'item_{i+1}_quantity'] = str(item['quantity'])
                    metadata[f'item_{i+1}_price'] = str(item['price'])
                    metadata[f'item_{i+1}_total'] = str(float(item['price']) * item['quantity'])
                    # Add product URL for admin access
                    production_domain = settings.PRODUCTION_DOMAIN
                    base_url = f"https://{production_domain}" if production_domain != 'localhost:3000' else 'http://localhost:3000'
                    metadata[f'item_{i+1}_url'] = f"{base_url}/admin/products/product/{product.id}"
                except Product.DoesNotExist:
                    raise Exception(f'Product with ID {item["product_id"]} not found')
            
            # Create a descriptive order summary (products already validated above)
            product_names = []
            for item in order_items:
                try:
                    product = Product.objects.get(id=item['product_id'])
                    product_names.append(f"{product.name} x{item['quantity']}")
                except Product.DoesNotExist:
                    # This shouldn't happen since we validated above, but just in case
                    product_names.append(f"Product ID {item['product_id']} x{item['quantity']}")
            
            description = f"Order for {order_data['customer_email']} - Items: {'; '.join(product_names)}"
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=total_amount_cents,
                currency='cad',  # You can make this configurable based on billing_country
                metadata=metadata,
                description=description,
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
            from products.models import Product
            
            line_items = []
            for item in order_items:
                # Get product details if product_id is available
                if 'product_id' in item:
                    try:
                        product = Product.objects.select_related('category').get(id=item['product_id'])
                        
                        # Validate product availability before creating checkout session
                        if not product.is_available:
                            raise Exception(f'Product "{product.name}" is no longer available')
                        
                        # Validate quantity availability
                        if item['quantity'] > product.quantity:
                            raise Exception(f'Only {product.quantity} units of "{product.name}" are available')
                        
                        # Validate price hasn't changed
                        if item['price'] != product.price:
                            raise Exception(f'Price for "{product.name}" has changed. Please refresh your cart.')
                        
                        # Try to use existing Stripe product/price or create new ones
                        stripe_product = StripeService.create_or_get_stripe_product(product)
                        
                        if stripe_product:
                            # Check if we have an existing price for this amount
                            existing_prices = stripe.Price.list(
                                product=stripe_product.id,
                                unit_amount=int(Decimal(str(item['price'])) * 100)
                            )
                            
                            if existing_prices.data:
                                # Use existing price
                                line_item = {
                                    'price': existing_prices.data[0].id,
                                    'quantity': item['quantity'],
                                }
                            else:
                                # Create new price for this product
                                stripe_price = StripeService.create_stripe_price(stripe_product, Decimal(str(item['price'])))
                                
                                if stripe_price:
                                    line_item = {
                                        'price': stripe_price.id,
                                        'quantity': item['quantity'],
                                    }
                                else:
                                    # Fallback to price_data if price creation fails
                                    line_item = {
                                        'price_data': {
                                            'currency': 'cad',
                                            'product': stripe_product.id,
                                            'unit_amount': int(Decimal(str(item['price'])) * 100),
                                        },
                                        'quantity': item['quantity'],
                                    }
                        else:
                            # Fallback to inline product creation
                            product_name = product.name
                            product_description = product.description[:500] if product.description else None
                            category_name = product.category.name if product.category else 'Unknown'
                            
                            line_item = {
                                'price_data': {
                                    'currency': 'cad',
                                    'product_data': {
                                        'name': product_name,
                                        'metadata': {
                                            'product_id': str(item.get('product_id', 'unknown')),
                                            'category': category_name,
                                            'product_url': f"{settings.BASE_URL}/admin/products/product/{item.get('product_id', 'unknown')}"
                                        }
                                    },
                                    'unit_amount': int(Decimal(str(item['price'])) * 100),
                                },
                                'quantity': item['quantity'],
                            }
                            
                            # Add description if available
                            if product_description:
                                line_item['price_data']['product_data']['description'] = product_description
                                
                    except Product.DoesNotExist:
                        # Product not found in database
                        product_name = item.get('name', f'Product ID {item["product_id"]}')
                        line_item = {
                            'price_data': {
                                'currency': 'cad',
                                'product_data': {
                                    'name': product_name,
                                    'metadata': {
                                        'product_id': str(item.get('product_id', 'unknown')),
                                        'category': 'Unknown',
                                        'product_url': f"{settings.BASE_URL}/admin/products/product/{item.get('product_id', 'unknown')}"
                                    }
                                },
                                'unit_amount': int(Decimal(str(item['price'])) * 100),
                            },
                            'quantity': item['quantity'],
                        }
                else:
                    # No product_id provided, use basic product data
                    product_name = item.get('name', 'Product')
                    product_description = item.get('description', None)
                    
                    line_item = {
                        'price_data': {
                            'currency': 'cad',
                            'product_data': {
                                'name': product_name,
                                'metadata': {
                                    'product_id': 'unknown',
                                    'category': 'Unknown',
                                    'product_url': f"{settings.BASE_URL}/admin/products/unknown"
                                }
                            },
                            'unit_amount': int(Decimal(str(item['price'])) * 100),
                        },
                        'quantity': item['quantity'],
                    }
                    
                    # Add description if available
                    if product_description:
                        line_item['price_data']['product_data']['description'] = product_description
                
                line_items.append(line_item)

            # Add custom tax if there's tax amount on the order
            session_params = {
                'mode': 'payment',
                'payment_method_types': ['card'],
                'line_items': line_items,
                'customer_email': order.customer_email,
                # Disable automatic tax - we calculate our own tax amounts
                'automatic_tax': {'enabled': False},
                'metadata': {
                    'order_number': order.order_number,
                    'customer_name': f"{order.customer_first_name} {order.customer_last_name}",
                    'total_items': len(order_items)
                },
                'success_url': settings.STRIPE_SUCCESS_URL + f'?session_id={{CHECKOUT_SESSION_ID}}&token={order.confirmation_token}',
                'cancel_url': settings.STRIPE_CANCEL_URL + f'?token={order.confirmation_token}',
            }
            
            # Add custom tax amount if there's tax on the order
            if order.tax_amount and order.tax_amount > 0:
                session_params['invoice_creation'] = {
                    'enabled': True,
                    'invoice_data': {
                        'metadata': {
                            'order_number': order.order_number,
                            'tax_amount': str(order.tax_amount),
                            'tax_note': f'Tax calculated based on {order.billing_country} billing address'
                        }
                    }
                }
                # Add tax as a line item
                tax_line_item = {
                    'price_data': {
                        'currency': 'cad',
                        'product_data': {
                            'name': 'Tax',
                            'metadata': {
                                'type': 'tax',
                                'billing_country': order.billing_country
                            }
                        },
                        'unit_amount': int(order.tax_amount * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }
                session_params['line_items'].append(tax_line_item)
            
            session = stripe.checkout.Session.create(**session_params)
            return session
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Checkout session error: {str(e)}")

    @staticmethod
    def get_checkout_session(session_id):
        """Retrieve a Stripe Checkout Session."""
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            return session
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Checkout session retrieval error: {str(e)}")
