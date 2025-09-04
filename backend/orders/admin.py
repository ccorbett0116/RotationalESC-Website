from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'customer_email', 'customer_first_name', 
        'customer_last_name', 'status', 'total_amount', 'created_at'
    ]
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['order_number', 'customer_email', 'customer_first_name', 'customer_last_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'status', 'created_at', 'updated_at')
        }),
        ('Customer Information', {
            'fields': ('customer_email', 'customer_first_name', 'customer_last_name', 'customer_phone')
        }),
        ('Billing Address', {
            'fields': (
                'billing_address_line1', 'billing_address_line2', 'billing_city',
                'billing_state', 'billing_postal_code', 'billing_country'
            )
        }),
        ('Shipping Address', {
            'fields': (
                'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
                'shipping_state', 'shipping_postal_code', 'shipping_country'
            )
        }),
        ('Order Totals', {
            'fields': ('subtotal', 'tax_amount', 'total_amount')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'payment_status')
        }),
    )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price', 'total_price']
    list_filter = ['order__created_at']
    readonly_fields = ['total_price']
