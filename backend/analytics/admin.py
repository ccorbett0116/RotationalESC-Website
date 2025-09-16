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
    list_display = ['ip_address_link', 'location_summary', 'isp_link', 'visit_count', 'first_visit', 'last_visit']
    list_filter = ['country', 'region', 'isp', 'first_visit', 'last_visit']
    search_fields = ['ip_address', 'country', 'region', 'city', 'isp', 'organization']
    readonly_fields = ['id', 'first_visit', 'last_visit', 'analytics_summary', 'page_views_link', 'product_views_link', 'search_queries_link', 'events_link']
    ordering = ['-last_visit']
    
    def ip_address_link(self, obj):
        # Create a link that shows all analytics for this IP
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_pageview_changelist')
        query = urlencode({'visitor__ip_address__exact': obj.ip_address})
        url = f"{base_url}?{query}"
        return format_html('<a href="{}" style="color: #007cba; font-weight: bold;">{}</a>', url, obj.ip_address)
    ip_address_link.short_description = 'IP Address'
    ip_address_link.admin_order_field = 'ip_address'
    
    def location_summary(self, obj):
        location_parts = [part for part in [obj.city, obj.region, obj.country] if part]
        location = ', '.join(location_parts) if location_parts else 'Unknown'
        
        # Create filtered links for each location component
        if obj.country:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_visitor_changelist')
            query = urlencode({'country__exact': obj.country})
            url = f"{base_url}?{query}"
            return format_html('<a href="{}" style="color: #007cba;">{}</a>', url, location)
        return location
    location_summary.short_description = 'Location'
    
    def isp_link(self, obj):
        if obj.isp:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_visitor_changelist')
            query = urlencode({'isp__exact': obj.isp})
            url = f"{base_url}?{query}"
            return format_html('<a href="{}" style="color: #007cba;">{}</a>', url, obj.isp)
        return 'Unknown'
    isp_link.short_description = 'ISP'
    isp_link.admin_order_field = 'isp'
    
    def analytics_summary(self, obj):
        page_views = obj.page_views.count()
        product_views = obj.product_views.count()
        searches = obj.searches.count()
        events = obj.events.count()
        
        return format_html(
            '<strong>Activity Summary:</strong><br/>'
            '• {} page views<br/>'
            '• {} product views<br/>'
            '• {} searches<br/>'
            '• {} events',
            page_views, product_views, searches, events
        )
    analytics_summary.short_description = 'Analytics Summary'
    
    def page_views_link(self, obj):
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_pageview_changelist')
        query = urlencode({'visitor__id__exact': obj.id})
        url = f"{base_url}?{query}"
        count = obj.page_views.count()
        return format_html('<a href="{}">View {} page views</a>', url, count)
    page_views_link.short_description = 'Page Views'
    
    def product_views_link(self, obj):
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_productview_changelist')
        query = urlencode({'visitor__id__exact': obj.id})
        url = f"{base_url}?{query}"
        count = obj.product_views.count()
        return format_html('<a href="{}">View {} product views</a>', url, count)
    product_views_link.short_description = 'Product Views'
    
    def search_queries_link(self, obj):
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_searchquery_changelist')
        query = urlencode({'visitor__id__exact': obj.id})
        url = f"{base_url}?{query}"
        count = obj.searches.count()
        return format_html('<a href="{}">View {} searches</a>', url, count)
    search_queries_link.short_description = 'Search Queries'
    
    def events_link(self, obj):
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_userevent_changelist')
        query = urlencode({'visitor__id__exact': obj.id})
        url = f"{base_url}?{query}"
        count = obj.events.count()
        return format_html('<a href="{}">View {} events</a>', url, count)
    events_link.short_description = 'User Events'
    
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
        }),
        ('Analytics Overview', {
            'fields': ('analytics_summary',)
        }),
        ('Related Data', {
            'fields': ('page_views_link', 'product_views_link', 'search_queries_link', 'events_link')
        })
    )


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['visitor_ip_link', 'path_link', 'page_title', 'time_on_page', 'scroll_depth', 'referrer_domain', 'timestamp']
    list_filter = ['timestamp', 'path']
    search_fields = ['visitor__ip_address', 'path', 'page_title', 'full_url']
    readonly_fields = ['id', 'timestamp', 'visitor_link', 'related_page_views']
    ordering = ['-timestamp']
    
    def visitor_ip_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_ip_link.short_description = 'Visitor IP'
    visitor_ip_link.admin_order_field = 'visitor__ip_address'
    
    def path_link(self, obj):
        # Create a filtered link to show all page views for this path
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_pageview_changelist')
        query = urlencode({'path__exact': obj.path})
        url = f"{base_url}?{query}"
        return format_html('<a href="{}" style="color: #007cba;">{}</a>', url, obj.path)
    path_link.short_description = 'Page Path'
    path_link.admin_order_field = 'path'
    
    def referrer_domain(self, obj):
        if obj.referrer:
            from urllib.parse import urlparse
            domain = urlparse(obj.referrer).netloc
            if domain:
                # Create a filtered link to show all page views from this referrer domain
                from django.utils.http import urlencode
                base_url = reverse('admin:analytics_pageview_changelist')
                query = urlencode({'referrer__icontains': domain})
                url = f"{base_url}?{query}"
                return format_html('<a href="{}" style="color: #007cba;">{}</a>', url, domain)
            return obj.referrer[:30]
        return 'Direct'
    referrer_domain.short_description = 'Referrer'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor Details ({})</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    def related_page_views(self, obj):
        if obj.visitor:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_pageview_changelist')
            query = urlencode({'visitor__id__exact': obj.visitor.id})
            url = f"{base_url}?{query}"
            count = obj.visitor.page_views.count()
            return format_html('<a href="{}">View all {} page views by this visitor</a>', url, count)
        return 'No related data'
    related_page_views.short_description = 'Related Page Views'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'visitor_link', 'session_id', 'timestamp')
        }),
        ('Page Details', {
            'fields': ('path', 'full_url', 'page_title', 'referrer')
        }),
        ('Engagement', {
            'fields': ('time_on_page', 'scroll_depth', 'load_time')
        }),
        ('Related Data', {
            'fields': ('related_page_views',)
        })
    )


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ['visitor_ip_link', 'product_name_link', 'time_on_page', 'scroll_depth', 'added_to_cart', 'timestamp']
    list_filter = ['timestamp', 'product__category', 'added_to_cart']
    search_fields = ['visitor__ip_address', 'product__name']
    readonly_fields = ['id', 'timestamp', 'visitor_link', 'product_link', 'related_product_views', 'visitor_other_views']
    ordering = ['-timestamp']
    
    def visitor_ip_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_ip_link.short_description = 'Visitor IP'
    visitor_ip_link.admin_order_field = 'visitor__ip_address'
    
    def product_name_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.product.name)
        return 'No product'
    product_name_link.short_description = 'Product'
    product_name_link.admin_order_field = 'product__name'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor Details ({})</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    def product_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}">View Product Details</a>', url)
        return 'No product'
    product_link.short_description = 'Product'
    
    def related_product_views(self, obj):
        if obj.product:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_productview_changelist')
            query = urlencode({'product__id__exact': obj.product.id})
            url = f"{base_url}?{query}"
            count = obj.product.analytics_views.count()
            return format_html('<a href="{}">View all {} views of this product</a>', url, count)
        return 'No related data'
    related_product_views.short_description = 'Related Product Views'
    
    def visitor_other_views(self, obj):
        if obj.visitor:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_productview_changelist')
            query = urlencode({'visitor__id__exact': obj.visitor.id})
            url = f"{base_url}?{query}"
            count = obj.visitor.product_views.count()
            return format_html('<a href="{}">View all {} products viewed by this visitor</a>', url, count)
        return 'No related data'
    visitor_other_views.short_description = 'Visitor Other Product Views'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'timestamp', 'session_id')
        }),
        ('Relationships', {
            'fields': ('visitor_link', 'product_link')
        }),
        ('Engagement Data', {
            'fields': ('time_on_page', 'scroll_depth', 'added_to_cart', 'referrer')
        }),
        ('Detailed Views', {
            'fields': ('viewed_images', 'viewed_attachments')
        }),
        ('Related Analytics', {
            'fields': ('related_product_views', 'visitor_other_views')
        })
    )


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query', 'results_count', 'visitor_ip_link', 'clicked_products_links', 'timestamp']
    list_filter = ['timestamp', 'results_count']
    search_fields = ['query', 'visitor__ip_address']
    readonly_fields = ['id', 'timestamp', 'visitor_link', 'clicked_products_display']
    ordering = ['-timestamp']
    
    def visitor_ip_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_ip_link.short_description = 'Visitor IP'
    visitor_ip_link.admin_order_field = 'visitor__ip_address'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor Details ({})</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    def clicked_products_links(self, obj):
        if not obj.clicked_results:
            return 'No clicks'
        
        from products.models import Product
        links = []
        for product_id in obj.clicked_results[:5]:  # Show max 5 products
            try:
                product = Product.objects.get(id=product_id)
                url = reverse('admin:products_product_change', args=[product.id])
                links.append(format_html('<a href="{}" style="color: #007cba; margin-right: 5px;">{}</a>', url, product.name[:20]))
            except Product.DoesNotExist:
                continue
        
        result = mark_safe(', '.join(links))
        if len(obj.clicked_results) > 5:
            result += f' ... (+{len(obj.clicked_results) - 5} more)'
        return result or 'No valid products'
    clicked_products_links.short_description = 'Clicked Products'
    
    def clicked_products_display(self, obj):
        return self.clicked_products_links(obj)
    clicked_products_display.short_description = 'Clicked Products'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'query', 'results_count', 'timestamp')
        }),
        ('Visitor Info', {
            'fields': ('visitor_link', 'session_id')
        }),
        ('Results', {
            'fields': ('clicked_products_display',)
        })
    )


@admin.register(UserEvent)
class UserEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'visitor_ip_link', 'page_path_link', 'element_text', 'product_name_link', 'timestamp']
    list_filter = ['event_type', 'timestamp', 'page_path']
    search_fields = ['visitor__ip_address', 'element_text', 'page_path']
    readonly_fields = ['id', 'timestamp', 'visitor_link', 'product_link', 'related_events']
    ordering = ['-timestamp']
    
    def visitor_ip_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_ip_link.short_description = 'Visitor IP'
    visitor_ip_link.admin_order_field = 'visitor__ip_address'
    
    def page_path_link(self, obj):
        # Create a filtered link to show all events on this page
        from django.utils.http import urlencode
        base_url = reverse('admin:analytics_userevent_changelist')
        query = urlencode({'page_path__exact': obj.page_path})
        url = f"{base_url}?{query}"
        return format_html('<a href="{}" style="color: #007cba;">{}</a>', url, obj.page_path)
    page_path_link.short_description = 'Page Path'
    page_path_link.admin_order_field = 'page_path'
    
    def product_name_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none;">{}</a>', url, obj.product.name)
        return 'None'
    product_name_link.short_description = 'Product'
    product_name_link.admin_order_field = 'product__name'
    
    def visitor_link(self, obj):
        if obj.visitor:
            url = reverse('admin:analytics_visitor_change', args=[obj.visitor.id])
            return format_html('<a href="{}">View Visitor Details ({})</a>', url, obj.visitor.ip_address)
        return 'No visitor'
    visitor_link.short_description = 'Visitor'
    
    def product_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}">View Product Details</a>', url)
        return 'No product'
    product_link.short_description = 'Product'
    
    def related_events(self, obj):
        if obj.visitor:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_userevent_changelist')
            query = urlencode({'visitor__id__exact': obj.visitor.id})
            url = f"{base_url}?{query}"
            count = obj.visitor.events.count()
            return format_html('<a href="{}">View all {} events by this visitor</a>', url, count)
        return 'No related data'
    related_events.short_description = 'Related Events'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'event_type', 'timestamp', 'session_id')
        }),
        ('Visitor & Location', {
            'fields': ('visitor_link', 'page_path')
        }),
        ('Event Details', {
            'fields': ('element_id', 'element_class', 'element_text', 'product_link', 'metadata')
        }),
        ('Related Data', {
            'fields': ('related_events',)
        })
    )


@admin.register(PopularProduct)
class PopularProductAdmin(admin.ModelAdmin):
    list_display = [
        'product_name_link', 'total_views', 'unique_views', 'formatted_avg_time', 
        'cart_additions', 'formatted_conversion_rate', 'purchases', 'formatted_purchase_rate', 'last_viewed'
    ]
    list_filter = ['last_viewed', 'updated_at']
    search_fields = ['product__name']
    readonly_fields = ['updated_at', 'product_link', 'view_analytics_link', 'product_events_link']
    ordering = ['-total_views']
    
    def product_name_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}" style="color: #007cba; text-decoration: none; font-weight: bold;">{}</a>', url, obj.product.name)
        return 'No product'
    product_name_link.short_description = 'Product'
    product_name_link.admin_order_field = 'product__name'
    
    def product_link(self, obj):
        if obj.product:
            url = reverse('admin:products_product_change', args=[obj.product.id])
            return format_html('<a href="{}">View Product Details</a>', url)
        return 'No product'
    product_link.short_description = 'Product Details'
    
    def view_analytics_link(self, obj):
        if obj.product:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_productview_changelist')
            query = urlencode({'product__id__exact': obj.product.id})
            url = f"{base_url}?{query}"
            return format_html('<a href="{}">View all {} analytics views</a>', url, obj.total_views)
        return 'No analytics'
    view_analytics_link.short_description = 'Analytics Views'
    
    def product_events_link(self, obj):
        if obj.product:
            from django.utils.http import urlencode
            base_url = reverse('admin:analytics_userevent_changelist')
            query = urlencode({'product__id__exact': obj.product.id})
            url = f"{base_url}?{query}"
            count = obj.product.events.count()
            return format_html('<a href="{}">View {} product events</a>', url, count)
        return 'No events'
    product_events_link.short_description = 'Product Events'
    
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
    
    fieldsets = (
        ('Product Info', {
            'fields': ('product_link', 'last_viewed', 'updated_at')
        }),
        ('View Statistics', {
            'fields': ('total_views', 'unique_views', 'total_time_viewed', 'avg_time_viewed')
        }),
        ('Conversion Metrics', {
            'fields': ('cart_additions', 'conversion_rate', 'purchases', 'purchase_rate')
        }),
        ('Related Analytics', {
            'fields': ('view_analytics_link', 'product_events_link')
        })
    )


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