from django.contrib import admin
from django.db.models import Count, Sum, Avg, Q
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta, date
from collections import defaultdict
import json
from .models import (
    Visitor, PageView, ProductView, SearchQuery, 
    UserEvent, PopularProduct, AnalyticsSummary
)
from .services import AnalyticsService


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'country', 'region', 'city', 'isp', 'visit_count', 'first_visit', 'last_visit']
    list_filter = ['country', 'region', 'isp', 'first_visit', 'last_visit']
    search_fields = ['ip_address', 'country', 'region', 'city', 'isp', 'organization']
    readonly_fields = ['id', 'first_visit', 'last_visit']
    ordering = ['-last_visit']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'ip_address', 'visit_count', 'first_visit', 'last_visit')
        }),
        ('Location', {
            'fields': ('country', 'region', 'city', 'timezone_name')
        }),
        ('Network', {
            'fields': ('isp', 'organization')
        }),
        ('Browser', {
            'fields': ('user_agent',)
        })
    )


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['visitor_ip', 'path', 'page_title', 'time_on_page', 'scroll_depth', 'timestamp']
    list_filter = ['timestamp', 'path']
    search_fields = ['visitor__ip_address', 'path', 'page_title', 'full_url']
    readonly_fields = ['id', 'timestamp', 'visitor_link']
    ordering = ['-timestamp']
    
    def visitor_ip(self, obj):
        return obj.visitor.ip_address
    visitor_ip.short_description = 'Visitor IP'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor Details</a>', url)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'visitor_link', 'session_id', 'timestamp')
        }),
        ('Page Details', {
            'fields': ('path', 'full_url', 'page_title', 'referrer')
        }),
        ('Engagement', {
            'fields': ('time_on_page', 'scroll_depth', 'load_time')
        })
    )


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ['visitor_ip', 'product_name', 'time_on_page', 'scroll_depth', 'added_to_cart', 'timestamp']
    list_filter = ['timestamp', 'product__category', 'added_to_cart']
    search_fields = ['visitor__ip_address', 'product__name']
    readonly_fields = ['id', 'timestamp', 'visitor_link', 'product_link']
    ordering = ['-timestamp']
    
    def visitor_ip(self, obj):
        return obj.visitor.ip_address
    visitor_ip.short_description = 'Visitor IP'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor</a>', url)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    def product_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}">View Product</a>', url)
        return 'No product'
    product_link.short_description = 'Product'


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query', 'results_count', 'visitor_ip', 'timestamp']
    list_filter = ['timestamp', 'results_count']
    search_fields = ['query', 'visitor__ip_address']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']
    
    def visitor_ip(self, obj):
        return obj.visitor.ip_address
    visitor_ip.short_description = 'Visitor IP'


@admin.register(UserEvent)
class UserEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'visitor_ip', 'page_path', 'element_text', 'product_name', 'timestamp']
    list_filter = ['event_type', 'timestamp', 'page_path']
    search_fields = ['visitor__ip_address', 'element_text', 'page_path']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']
    
    def visitor_ip(self, obj):
        return obj.visitor.ip_address
    visitor_ip.short_description = 'Visitor IP'
    
    def product_name(self, obj):
        return obj.product.name if obj.product else 'None'
    product_name.short_description = 'Product'


@admin.register(PopularProduct)
class PopularProductAdmin(admin.ModelAdmin):
    list_display = [
        'product_name', 'total_views', 'unique_views', 'formatted_avg_time', 
        'cart_additions', 'formatted_conversion_rate', 'purchases', 'formatted_purchase_rate', 'last_viewed'
    ]
    list_filter = ['last_viewed', 'updated_at']
    search_fields = ['product__name']
    readonly_fields = ['updated_at', 'product_link']
    ordering = ['-total_views']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def product_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}">View Product</a>', url)
        return 'No product'
    product_link.short_description = 'Product'
    
    def formatted_avg_time(self, obj):
        """Format average time viewed to remove decimals"""
        return f"{int(obj.avg_time_viewed)}s" if obj.avg_time_viewed else "0s"
    formatted_avg_time.short_description = 'Avg Time'
    
    def formatted_conversion_rate(self, obj):
        """Format conversion rate to 1 decimal place"""
        return f"{obj.conversion_rate:.1f}%" if obj.conversion_rate else "0.0%"
    formatted_conversion_rate.short_description = 'Cart Rate'
    
    def formatted_purchase_rate(self, obj):
        """Format purchase rate to 1 decimal place"""
        return f"{obj.purchase_rate:.1f}%" if obj.purchase_rate else "0.0%"
    formatted_purchase_rate.short_description = 'Purchase Rate'
    
    actions = ['recalculate_stats']
    
    def recalculate_stats(self, request, queryset):
        from .services import AnalyticsService
        count = 0
        for pop_product in queryset:
            AnalyticsService.update_product_popularity(pop_product.product)
            count += 1
        self.message_user(request, f'Recalculated stats for {count} products.')
    recalculate_stats.short_description = "Recalculate popularity statistics"


@admin.register(AnalyticsSummary)
class AnalyticsSummaryAdmin(admin.ModelAdmin):
    list_display = [
        'period', 'date', 'unique_visitors', 'total_page_views', 
        'total_product_views', 'avg_session_duration', 'bounce_rate'
    ]
    list_filter = ['period', 'date']
    readonly_fields = ['created_at']
    ordering = ['-date']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('period', 'date', 'created_at')
        }),
        ('Traffic Metrics', {
            'fields': ('unique_visitors', 'total_page_views', 'total_product_views')
        }),
        ('Engagement Metrics', {
            'fields': ('avg_session_duration', 'bounce_rate')
        }),
        ('Top Lists', {
            'fields': ('top_pages', 'top_products', 'top_countries', 'top_referrers'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['regenerate_summary']
    
    def regenerate_summary(self, request, queryset):
        from .services import AnalyticsService
        count = 0
        for summary in queryset:
            if summary.period == 'daily':
                AnalyticsService.generate_daily_summary(summary.date)
                count += 1
        self.message_user(request, f'Regenerated {count} daily summaries.')
    regenerate_summary.short_description = "Regenerate selected summaries"



# Custom admin site customizations
admin.site.site_header = "Rotational Equipment Analytics"
admin.site.site_title = "Analytics Admin"
admin.site.index_title = "Website Analytics Dashboard"