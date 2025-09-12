from django.contrib import admin
from django.db.models import Count, Sum, Avg, Q
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from django.template.response import TemplateResponse
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
        'product_name', 'total_views', 'unique_views', 'avg_time_viewed', 
        'cart_additions', 'conversion_rate', 'last_viewed'
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


# Custom Analytics Dashboard Views
class AnalyticsDashboardAdmin(admin.ModelAdmin):
    """Custom admin class to add analytics dashboard pages"""
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_site.admin_view(self.analytics_dashboard), name='analytics_dashboard'),
            path('visitor-analytics/', self.admin_site.admin_view(self.visitor_analytics), name='visitor_analytics'),
            path('product-analytics/', self.admin_site.admin_view(self.product_analytics), name='product_analytics'),
            path('real-time/', self.admin_site.admin_view(self.real_time_analytics), name='real_time_analytics'),
            path('dashboard-data/', self.admin_site.admin_view(self.dashboard_data_api), name='dashboard_data_api'),
        ]
        return custom_urls + urls
    
    def analytics_dashboard(self, request):
        """Main analytics dashboard with overview statistics"""
        context = self.get_dashboard_context(request)
        return TemplateResponse(request, 'admin/analytics/dashboard.html', context)
    
    def visitor_analytics(self, request):
        """Detailed visitor analytics page"""
        context = self.get_visitor_context(request)
        return TemplateResponse(request, 'admin/analytics/visitor_analytics.html', context)
    
    def product_analytics(self, request):
        """Product analytics page"""
        context = self.get_product_context(request)
        return TemplateResponse(request, 'admin/analytics/product_analytics.html', context)
    
    def real_time_analytics(self, request):
        """Real-time analytics page"""
        context = self.get_real_time_context(request)
        return TemplateResponse(request, 'admin/analytics/real_time.html', context)
    
    def dashboard_data_api(self, request):
        """API endpoint for dashboard data (for AJAX updates)"""
        timeframe = request.GET.get('timeframe', 'week')
        data = self.get_analytics_data(timeframe)
        return JsonResponse(data)
    
    def get_dashboard_context(self, request):
        """Get context data for main dashboard"""
        timeframe = request.GET.get('timeframe', 'week')
        
        # Date range calculation
        now = timezone.now()
        if timeframe == 'day':
            start_date = now - timedelta(days=1)
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
        else:  # week
            start_date = now - timedelta(days=7)
        
        # Basic metrics
        total_visitors = Visitor.objects.count()
        visitors_period = Visitor.objects.filter(last_visit__gte=start_date).count()
        page_views_period = PageView.objects.filter(timestamp__gte=start_date).count()
        product_views_period = ProductView.objects.filter(timestamp__gte=start_date).count()
        
        # Top pages
        top_pages = list(PageView.objects.filter(
            timestamp__gte=start_date
        ).values('path').annotate(
            views=Count('id')
        ).order_by('-views')[:10])
        
        # Top countries
        top_countries = list(Visitor.objects.filter(
            last_visit__gte=start_date
        ).exclude(country='').values('country').annotate(
            visitors=Count('id')
        ).order_by('-visitors')[:10])
        
        # Top ISPs
        top_isps = list(Visitor.objects.filter(
            last_visit__gte=start_date
        ).exclude(isp='').values('isp').annotate(
            visitors=Count('id')
        ).order_by('-visitors')[:10])
        
        # Popular products
        popular_products = PopularProduct.objects.select_related('product').order_by('-total_views')[:10]
        
        # Recent activity
        recent_visitors = Visitor.objects.order_by('-last_visit')[:20]
        recent_page_views = PageView.objects.select_related('visitor').order_by('-timestamp')[:20]
        
        # Daily visitor trend (last 30 days)
        daily_stats = []
        for i in range(29, -1, -1):
            day = now.date() - timedelta(days=i)
            day_start = timezone.datetime.combine(day, timezone.datetime.min.time())
            day_end = day_start + timedelta(days=1)
            
            visitors = Visitor.objects.filter(
                last_visit__gte=day_start, 
                last_visit__lt=day_end
            ).count()
            
            page_views = PageView.objects.filter(
                timestamp__gte=day_start,
                timestamp__lt=day_end
            ).count()
            
            daily_stats.append({
                'date': day.strftime('%m/%d'),
                'visitors': visitors,
                'page_views': page_views
            })
        
        return {
            'title': 'Analytics Dashboard',
            'timeframe': timeframe,
            'total_visitors': total_visitors,
            'visitors_period': visitors_period,
            'page_views_period': page_views_period,
            'product_views_period': product_views_period,
            'top_pages': top_pages,
            'top_countries': top_countries,
            'top_isps': top_isps,
            'popular_products': popular_products,
            'recent_visitors': recent_visitors,
            'recent_page_views': recent_page_views,
            'daily_stats': json.dumps(daily_stats),
        }
    
    def get_visitor_context(self, request):
        """Get context data for visitor analytics"""
        timeframe = request.GET.get('timeframe', 'week')
        
        now = timezone.now()
        if timeframe == 'day':
            start_date = now - timedelta(days=1)
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=7)
        
        # Visitor location data
        country_data = list(Visitor.objects.filter(
            last_visit__gte=start_date
        ).exclude(country='').values('country', 'region', 'city').annotate(
            count=Count('id')
        ).order_by('-count')[:50])
        
        # ISP analysis
        isp_data = list(Visitor.objects.filter(
            last_visit__gte=start_date
        ).exclude(isp='').values('isp').annotate(
            count=Count('id')
        ).order_by('-count')[:20])
        
        # Browser/User Agent analysis
        user_agents = Visitor.objects.filter(
            last_visit__gte=start_date
        ).exclude(user_agent='').values_list('user_agent', flat=True)[:100]
        
        # Session analysis
        session_stats = PageView.objects.filter(
            timestamp__gte=start_date
        ).values('session_id').annotate(
            page_count=Count('id')
        )
        
        single_page_sessions = session_stats.filter(page_count=1).count()
        total_sessions = session_stats.count()
        bounce_rate = (single_page_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        return {
            'title': 'Visitor Analytics',
            'timeframe': timeframe,
            'country_data': country_data,
            'isp_data': isp_data,
            'user_agents': list(user_agents),
            'bounce_rate': round(bounce_rate, 2),
            'total_sessions': total_sessions,
        }
    
    def get_product_context(self, request):
        """Get context data for product analytics"""
        # Most popular products
        popular_products = PopularProduct.objects.select_related('product').order_by('-total_views')[:20]
        
        # Product categories performance
        from products.models import Category
        category_stats = []
        for category in Category.objects.all():
            stats = PopularProduct.objects.filter(product__category=category).aggregate(
                total_views=Sum('total_views'),
                total_unique=Sum('unique_views'),
                total_cart_adds=Sum('cart_additions')
            )
            if stats['total_views']:
                category_stats.append({
                    'name': category.name,
                    'total_views': stats['total_views'] or 0,
                    'unique_views': stats['total_unique'] or 0,
                    'cart_additions': stats['total_cart_adds'] or 0,
                })
        
        category_stats.sort(key=lambda x: x['total_views'], reverse=True)
        
        # Recent product views
        recent_product_views = ProductView.objects.select_related(
            'visitor', 'product'
        ).order_by('-timestamp')[:50]
        
        return {
            'title': 'Product Analytics',
            'popular_products': popular_products,
            'category_stats': category_stats,
            'recent_product_views': recent_product_views,
        }
    
    def get_real_time_context(self, request):
        """Get context for real-time analytics"""
        real_time_data = AnalyticsService.get_real_time_stats()
        
        # Recent events (last hour)
        recent_events = UserEvent.objects.select_related(
            'visitor', 'product'
        ).filter(
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).order_by('-timestamp')[:100]
        
        # Active visitors (last 5 minutes)
        active_visitors = Visitor.objects.filter(
            last_visit__gte=timezone.now() - timedelta(minutes=5)
        ).order_by('-last_visit')[:50]
        
        # Current popular pages (last hour)
        current_popular = PageView.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).values('path').annotate(
            views=Count('id')
        ).order_by('-views')[:10]
        
        return {
            'title': 'Real-Time Analytics',
            'real_time_stats': real_time_data,
            'recent_events': recent_events,
            'active_visitors': active_visitors,
            'current_popular': current_popular,
        }
    
    def get_analytics_data(self, timeframe):
        """Get analytics data for API responses"""
        now = timezone.now()
        if timeframe == 'day':
            start_date = now - timedelta(days=1)
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=7)
        
        return {
            'visitors': Visitor.objects.filter(last_visit__gte=start_date).count(),
            'page_views': PageView.objects.filter(timestamp__gte=start_date).count(),
            'product_views': ProductView.objects.filter(timestamp__gte=start_date).count(),
            'events': UserEvent.objects.filter(timestamp__gte=start_date).count(),
        }

# Register a dummy model to create the dashboard URLs
class AnalyticsDashboard(admin.ModelAdmin):
    def has_module_permission(self, request):
        return request.user.is_staff

# Create admin instance for dashboard
dashboard_admin = AnalyticsDashboardAdmin(AnalyticsSummary, admin.site)

# Custom admin site customizations
admin.site.site_header = "Rotational Equipment Analytics"
admin.site.site_title = "Analytics Admin"
admin.site.index_title = "Website Analytics Dashboard"