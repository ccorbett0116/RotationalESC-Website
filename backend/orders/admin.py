from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Sum, Count
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price', 'formatted_total']
    fields = ['product', 'quantity', 'price', 'total_price', 'formatted_total']
    
    def formatted_total(self, obj):
        if obj and obj.total_price:
            return format_html(
                '<span style="font-weight: bold; color: #27ae60;">${}</span>',
                f"{obj.total_price:.2f}"
            )
        return "$0.00"
    formatted_total.short_description = "Total"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number_link', 'customer_info', 'status_badge', 
        'payment_status_badge', 'formatted_total', 'order_date', 'actions_column'
    ]
    list_filter = ['status', 'payment_status', 'created_at', 'billing_country']
    search_fields = ['order_number', 'customer_email', 'customer_first_name', 'customer_last_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'order_summary']
    inlines = [OrderItemInline]
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related().prefetch_related('items__product')
    
    def order_number_link(self, obj):
        url = reverse('admin:orders_order_change', args=[obj.pk])
        return format_html('<a href="{}" style="font-weight: bold; color: #2c3e50;">{}</a>', url, obj.order_number)
    order_number_link.short_description = "Order #"
    order_number_link.admin_order_field = 'order_number'
    
    def customer_info(self, obj):
        return format_html(
            '<strong>{} {}</strong><br><small style="color: #666;">{}</small>',
            obj.customer_first_name,
            obj.customer_last_name,
            obj.customer_email
        )
    customer_info.short_description = "Customer"
    customer_info.admin_order_field = 'customer_last_name'
    
    def status_badge(self, obj):
        status_colors = {
            'pending': '#f39c12',
            'processing': '#17a2b8',
            'shipped': '#3498db',
            'delivered': '#27ae60',
            'cancelled': '#e74c3c'
        }
        color = status_colors.get(obj.status, '#6c757d')
        return format_html(
            '<span class="status-badge" style="background-color: {}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"
    status_badge.admin_order_field = 'status'
    
    def payment_status_badge(self, obj):
        if obj.payment_status == 'paid':
            color = '#27ae60'
        elif obj.payment_status == 'failed':
            color = '#e74c3c'
        else:
            color = '#f39c12'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 6px; border-radius: 8px; font-size: 10px; font-weight: bold;">{}</span>',
            color,
            obj.payment_status.upper()
        )
    payment_status_badge.short_description = "Payment"
    payment_status_badge.admin_order_field = 'payment_status'
    
    def formatted_total(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2c3e50; font-size: 14px;">${}</span>',
            f"{obj.total_amount:.2f}"
        )
    formatted_total.short_description = "Total"
    formatted_total.admin_order_field = 'total_amount'
    
    def order_date(self, obj):
        return format_html(
            '<span style="color: #666;">{}</span><br><small>{}</small>',
            obj.created_at.strftime('%Y-%m-%d'),
            obj.created_at.strftime('%H:%M')
        )
    order_date.short_description = "Date"
    order_date.admin_order_field = 'created_at'
    
    def actions_column(self, obj):
        actions = []
        if obj.status == 'pending':
            actions.append('<span style="color: #f39c12;">⏳ Processing</span>')
        elif obj.status == 'processing':
            actions.append('<span style="color: #17a2b8;">📦 Ship</span>')
        elif obj.status == 'shipped':
            actions.append('<span style="color: #27ae60;">✅ Delivered</span>')
        
        return format_html('<br>'.join(actions)) if actions else '—'
    actions_column.short_description = "Quick Actions"
    
    def order_summary(self, obj):
        if not obj.pk:
            return "Save the order to see summary"
        
        items = obj.items.all()
        items_count = items.count()
        
        summary = format_html(
            '''
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4 style="margin-top: 0; color: #2c3e50;">📋 Order Summary</h4>
                <p><strong>Items:</strong> {} product(s)</p>
                <p><strong>Subtotal:</strong> ${:.2f}</p>
                <p><strong>Tax:</strong> ${:.2f}</p>
                <p><strong>Total:</strong> <span style="font-weight: bold; color: #27ae60; font-size: 16px;">${:.2f}</span></p>
            </div>
            ''',
            items_count, obj.subtotal, obj.tax_amount, obj.total_amount
        )
        
        if items:
            items_html = "<h4>🛍️ Items in this order:</h4><ul>"
            for item in items:
                items_html += format_html(
                    "<li>{} × {} = ${:.2f}</li>",
                    item.product.name, item.quantity, item.total_price
                )
            items_html += "</ul>"
            summary += mark_safe(items_html)
            
        return summary
    order_summary.short_description = "Order Summary"
    
    fieldsets = (
        ('📋 Order Information', {
            'fields': ('order_number', 'status', 'created_at', 'updated_at'),
            'classes': ('wide',)
        }),
        ('👤 Customer Information', {
            'fields': ('customer_email', 'customer_first_name', 'customer_last_name', 'customer_phone'),
            'classes': ('wide',)
        }),
        ('🏠 Billing Address', {
            'fields': (
                ('billing_address_line1', 'billing_address_line2'),
                ('billing_city', 'billing_state'),
                ('billing_postal_code', 'billing_country')
            ),
            'classes': ('collapse',)
        }),
        ('📦 Shipping Address', {
            'fields': (
                ('shipping_address_line1', 'shipping_address_line2'),
                ('shipping_city', 'shipping_state'),
                ('shipping_postal_code', 'shipping_country')
            ),
            'classes': ('collapse',)
        }),
        ('💰 Order Totals', {
            'fields': ('subtotal', 'tax_amount', 'total_amount'),
            'classes': ('wide',)
        }),
        ('💳 Payment Information', {
            'fields': ('payment_method', 'payment_status'),
            'classes': ('wide',)
        }),
        ('📊 Summary', {
            'fields': ('order_summary',),
            'classes': ('wide',)
        }),
    )
    
    actions = ['mark_as_processing', 'mark_as_shipped', 'mark_as_delivered']
    
    def mark_as_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} order(s) marked as processing.')
    mark_as_processing.short_description = "Mark selected orders as processing"
    
    def mark_as_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} order(s) marked as shipped.')
    mark_as_shipped.short_description = "Mark selected orders as shipped"
    
    def mark_as_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f'{updated} order(s) marked as delivered.')
    mark_as_delivered.short_description = "Mark selected orders as delivered"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order_link', 'product_info', 'quantity_display', 'price_display', 'total_display']
    list_filter = ['order__created_at', 'product__category']
    search_fields = ['order__order_number', 'product__name']
    readonly_fields = ['total_price']
    
    def order_link(self, obj):
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_link.short_description = "Order"
    order_link.admin_order_field = 'order__order_number'
    
    def product_info(self, obj):
        category_name = obj.product.category.name if obj.product.category else 'No category'
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.product.name,
            category_name
        )
    product_info.short_description = "Product"
    
    def quantity_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2c3e50;">{}</span>',
            obj.quantity
        )
    quantity_display.short_description = "Qty"
    quantity_display.admin_order_field = 'quantity'
    
    def price_display(self, obj):
        return format_html(
            '<span style="color: #666;">${}</span>',
            f"{obj.price:.2f}"
        )
    price_display.short_description = "Unit Price"
    price_display.admin_order_field = 'price'
    
    def total_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #27ae60;">${}</span>',
            f"{obj.total_price:.2f}"
        )
    total_display.short_description = "Total"
    readonly_fields = ['total_price']
