from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from .permissions import IsAnalyticsAdmin, IsTrackingAllowed
from .rate_limiting import rate_limit, tracking_rate_limit
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Avg, F, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from .models import (
    Visitor, PageView, ProductView, SearchQuery, 
    UserEvent, PopularProduct, AnalyticsSummary
)
from products.models import Product
from .services import AnalyticsService
import json
import logging

logger = logging.getLogger(__name__)


def add_no_cache_headers(response):
    """Add cache-busting headers to prevent analytics requests from being cached"""
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    response['Last-Modified'] = timezone.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
    return response


@api_view(['POST'])
@permission_classes([IsTrackingAllowed])
@never_cache
@rate_limit(max_requests=200, time_window=3600, key_func=tracking_rate_limit)
def track_product_view(request):
    """Track when a user views a product"""
    try:
        data = request.data
        product_id = data.get('product_id')
        
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get visitor from middleware
        visitor = getattr(request, 'visitor', None)
        if not visitor:
            return Response({'error': 'Visitor tracking not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create product view record (prevent duplicates)
        # Use a time window approach - only one record per visitor+product per hour
        from django.utils import timezone
        from datetime import timedelta
        
        session_id = getattr(request, 'analytics_session_id', '')
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        # Try to find recent record for same visitor+product
        try:
            product_view = ProductView.objects.filter(
                visitor=visitor,
                product=product,
                timestamp__gte=one_hour_ago
            ).first()
            created = False
        except ProductView.DoesNotExist:
            product_view = None
            
        if not product_view:
            # Create new record
            product_view = ProductView.objects.create(
                visitor=visitor,
                product=product,
                session_id=session_id,
                referrer=request.META.get('HTTP_REFERER', ''),
                viewed_images=data.get('viewed_images', []),
                viewed_attachments=data.get('viewed_attachments', []),
                time_on_page=data.get('time_on_page'),
                scroll_depth=data.get('scroll_depth')
            )
            created = True
        
        # If record exists, update it with new data
        if not created:
            updated = False
            if data.get('time_on_page') is not None:
                product_view.time_on_page = data.get('time_on_page')
                updated = True
            if data.get('scroll_depth') is not None:
                product_view.scroll_depth = max(product_view.scroll_depth or 0, data.get('scroll_depth'))
                updated = True
            if data.get('added_to_cart') is not None:
                product_view.added_to_cart = data.get('added_to_cart')
                updated = True
            if data.get('viewed_images'):
                # Merge image lists
                existing_images = set(product_view.viewed_images or [])
                new_images = set(data.get('viewed_images', []))
                product_view.viewed_images = list(existing_images.union(new_images))
                updated = True
            if data.get('viewed_attachments'):
                # Merge attachment lists
                existing_attachments = set(product_view.viewed_attachments or [])
                new_attachments = set(data.get('viewed_attachments', []))
                product_view.viewed_attachments = list(existing_attachments.union(new_attachments))
                updated = True
            
            if updated:
                product_view.save()
        
        # Update popular product stats asynchronously
        AnalyticsService.update_product_popularity(product)
        
        response = Response({'success': True, 'view_id': product_view.id})
        return add_no_cache_headers(response)
        
    except Exception as e:
        logger.error(f"Error tracking product view: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsTrackingAllowed])
@never_cache
@rate_limit(max_requests=50, time_window=3600, key_func=tracking_rate_limit)
def track_search(request):
    """Track search queries"""
    try:
        data = request.data
        query = data.get('query', '').strip()
        
        if not query:
            return Response({'error': 'query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        visitor = getattr(request, 'visitor', None)
        if not visitor:
            return Response({'error': 'Visitor tracking not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        search_record = SearchQuery.objects.create(
            visitor=visitor,
            session_id=getattr(request, 'analytics_session_id', ''),
            query=query[:500],  # Limit query length
            results_count=data.get('results_count', 0)
        )
        
        response = Response({'success': True, 'search_id': search_record.id})
        return add_no_cache_headers(response)
        
    except Exception as e:
        logger.error(f"Error tracking search: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsTrackingAllowed])
@never_cache
@rate_limit(max_requests=300, time_window=3600, key_func=tracking_rate_limit)
def track_event(request):
    """Track custom user events"""
    try:
        data = request.data
        event_type = data.get('event_type')
        
        if not event_type:
            return Response({'error': 'event_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        visitor = getattr(request, 'visitor', None)
        if not visitor:
            return Response({'error': 'Visitor tracking not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get product if specified
        product = None
        product_id = data.get('product_id')
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                pass
        
        event = UserEvent.objects.create(
            visitor=visitor,
            session_id=getattr(request, 'analytics_session_id', ''),
            event_type=event_type,
            element_id=data.get('element_id', ''),
            element_class=data.get('element_class', ''),
            element_text=data.get('element_text', ''),
            page_path=data.get('page_path', request.path),
            product=product,
            metadata=data.get('metadata', {})
        )
        
        response = Response({'success': True, 'event_id': event.id})
        return add_no_cache_headers(response)
        
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsTrackingAllowed])
@never_cache
@rate_limit(max_requests=500, time_window=3600, key_func=tracking_rate_limit)
def update_page_metrics(request):
    """Update page metrics like scroll depth and time on page"""
    try:
        data = request.data
        page_path = data.get('page_path')
        
        if not page_path:
            return Response({'error': 'page_path is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        visitor = getattr(request, 'visitor', None)
        if not visitor:
            return Response({'error': 'Visitor tracking not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = getattr(request, 'analytics_session_id', '')
        
        # Find the most recent page view for this visitor and path within the last hour
        from datetime import timedelta
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        page_view = PageView.objects.filter(
            visitor=visitor,
            path=page_path,
            session_id=session_id,
            timestamp__gte=one_hour_ago
        ).order_by('-timestamp').first()
        
        if page_view:
            # Update metrics
            if data.get('scroll_depth') is not None:
                page_view.scroll_depth = max(page_view.scroll_depth or 0, data['scroll_depth'])
            if data.get('time_on_page') is not None:
                page_view.time_on_page = data['time_on_page']
            if data.get('load_time') is not None:
                page_view.load_time = data['load_time']
            
            page_view.save()
            
            response = Response({'success': True, 'updated_existing': True})
            return add_no_cache_headers(response)
        else:
            # Create a new page view record since none exists (handles cached page views)
            page_view = PageView.objects.create(
                visitor=visitor,
                session_id=session_id,
                path=page_path,
                full_url=request.build_absolute_uri(page_path),
                referrer=request.META.get('HTTP_REFERER', ''),
                page_title=f"Cached Page: {page_path}",
                scroll_depth=data.get('scroll_depth', 0),
                time_on_page=data.get('time_on_page'),
                load_time=data.get('load_time')
            )
            
            response = Response({'success': True, 'created_new': True, 'view_id': page_view.id})
            return add_no_cache_headers(response)
        
    except Exception as e:
        logger.error(f"Error updating page metrics: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAnalyticsAdmin])
def get_popular_products(request):
    """Get most popular products based on analytics"""
    try:
        limit = int(request.GET.get('limit', 10))
        timeframe = request.GET.get('timeframe', 'all')  # 'week', 'month', 'all'
        
        # Build query based on timeframe
        if timeframe == 'week':
            date_filter = timezone.now() - timezone.timedelta(days=7)
            popular_products = PopularProduct.objects.filter(
                last_viewed__gte=date_filter
            ).order_by('-total_views')[:limit]
        elif timeframe == 'month':
            date_filter = timezone.now() - timezone.timedelta(days=30)
            popular_products = PopularProduct.objects.filter(
                last_viewed__gte=date_filter
            ).order_by('-total_views')[:limit]
        else:
            popular_products = PopularProduct.objects.all().order_by('-total_views')[:limit]
        
        # Format response
        products_data = []
        for pop_product in popular_products:
            product = pop_product.product
            products_data.append({
                'id': product.id,
                'name': product.name,
                'price': str(product.price),
                'total_views': pop_product.total_views,
                'unique_views': pop_product.unique_views,
                'avg_time_viewed': pop_product.avg_time_viewed,
                'cart_additions': pop_product.cart_additions,
                'conversion_rate': pop_product.conversion_rate,
                'last_viewed': pop_product.last_viewed
            })
        
        return Response({'popular_products': products_data})
        
    except Exception as e:
        logger.error(f"Error getting popular products: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAnalyticsAdmin])
def get_analytics_dashboard(request):
    """Get dashboard analytics data"""
    try:
        timeframe = request.GET.get('timeframe', 'week')  # 'day', 'week', 'month'
        
        if timeframe == 'day':
            date_filter = timezone.now() - timezone.timedelta(days=1)
        elif timeframe == 'week':
            date_filter = timezone.now() - timezone.timedelta(days=7)
        elif timeframe == 'month':
            date_filter = timezone.now() - timezone.timedelta(days=30)
        else:
            date_filter = timezone.now() - timezone.timedelta(days=7)
        
        # Basic metrics
        unique_visitors = Visitor.objects.filter(last_visit__gte=date_filter).count()
        total_page_views = PageView.objects.filter(timestamp__gte=date_filter).count()
        total_product_views = ProductView.objects.filter(timestamp__gte=date_filter).count()
        
        # Top pages
        top_pages = PageView.objects.filter(timestamp__gte=date_filter).values('path').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Top countries
        top_countries = Visitor.objects.filter(last_visit__gte=date_filter).exclude(
            country=''
        ).values('country').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Top ISPs
        top_isps = Visitor.objects.filter(last_visit__gte=date_filter).exclude(
            isp=''
        ).values('isp').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Recent searches
        recent_searches = SearchQuery.objects.filter(
            timestamp__gte=date_filter
        ).values('query').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Daily visitor trend
        if timeframe == 'month':
            trunc_func = TruncDate
        elif timeframe == 'week':
            trunc_func = TruncDate
        else:
            trunc_func = TruncDate
            
        visitor_trend = PageView.objects.filter(
            timestamp__gte=date_filter
        ).annotate(
            date=trunc_func('timestamp')
        ).values('date').annotate(
            visitors=Count('visitor', distinct=True),
            page_views=Count('id')
        ).order_by('date')
        
        return Response({
            'summary': {
                'unique_visitors': unique_visitors,
                'total_page_views': total_page_views,
                'total_product_views': total_product_views,
                'timeframe': timeframe
            },
            'top_pages': list(top_pages),
            'top_countries': list(top_countries),
            'top_isps': list(top_isps),
            'recent_searches': list(recent_searches),
            'visitor_trend': list(visitor_trend)
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)