from django.db.models import Count, Avg, Sum, F, Q
from django.utils import timezone
from django.db import transaction
from .models import (
    Visitor, PageView, ProductView, PopularProduct, 
    AnalyticsSummary, UserEvent, SearchQuery
)
from products.models import Product
import logging
from datetime import timedelta, date
from collections import defaultdict

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service class for analytics calculations and data processing"""
    
    @staticmethod
    def update_product_popularity(product):
        """Update popularity statistics for a product"""
        try:
            with transaction.atomic():
                # Get or create popularity record
                popularity, created = PopularProduct.objects.get_or_create(
                    product=product,
                    defaults={
                        'total_views': 0,
                        'unique_views': 0,
                        'total_time_viewed': 0,
                        'cart_additions': 0
                    }
                )
                
                # Calculate stats from ProductView records
                product_views = ProductView.objects.filter(product=product)
                
                # Total and unique views
                popularity.total_views = product_views.count()
                popularity.unique_views = product_views.values('visitor').distinct().count()
                
                # Time viewed statistics
                time_stats = product_views.filter(
                    time_on_page__isnull=False
                ).aggregate(
                    total_time=Sum('time_on_page'),
                    avg_time=Avg('time_on_page')
                )
                
                popularity.total_time_viewed = time_stats['total_time'] or 0
                popularity.avg_time_viewed = time_stats['avg_time'] or 0.0
                
                # Cart additions from events
                popularity.cart_additions = UserEvent.objects.filter(
                    product=product,
                    event_type='cart_add'
                ).count()
                
                # Calculate conversion rate
                if popularity.unique_views > 0:
                    popularity.conversion_rate = (popularity.cart_additions / popularity.unique_views) * 100
                else:
                    popularity.conversion_rate = 0.0
                
                # Actual purchases from OrderItem
                from orders.models import OrderItem
                popularity.purchases = OrderItem.objects.filter(product=product).count()
                
                # Calculate purchase rate
                if popularity.unique_views > 0:
                    popularity.purchase_rate = (popularity.purchases / popularity.unique_views) * 100
                else:
                    popularity.purchase_rate = 0.0
                
                # Update last viewed
                last_view = product_views.order_by('-timestamp').first()
                if last_view:
                    popularity.last_viewed = last_view.timestamp
                
                popularity.save()
                
        except Exception as e:
            logger.error(f"Error updating product popularity for {product.id}: {e}")
    
    @staticmethod
    def generate_daily_summary(target_date=None):
        """Generate daily analytics summary"""
        if target_date is None:
            target_date = timezone.now().date() - timedelta(days=1)
        
        try:
            with transaction.atomic():
                # Delete existing summary for this date
                AnalyticsSummary.objects.filter(
                    period='daily',
                    date=target_date
                ).delete()
                
                # Calculate date range
                start_date = timezone.make_aware(timezone.datetime.combine(target_date, timezone.datetime.min.time()))
                end_date = start_date + timedelta(days=1)
                
                # Basic metrics
                unique_visitors = Visitor.objects.filter(
                    last_visit__gte=start_date,
                    last_visit__lt=end_date
                ).count()
                
                total_page_views = PageView.objects.filter(
                    timestamp__gte=start_date,
                    timestamp__lt=end_date
                ).count()
                
                total_product_views = ProductView.objects.filter(
                    timestamp__gte=start_date,
                    timestamp__lt=end_date
                ).count()
                
                # Session duration calculation
                avg_session_duration = AnalyticsService.calculate_avg_session_duration(
                    start_date, end_date
                )
                
                # Bounce rate calculation
                bounce_rate = AnalyticsService.calculate_bounce_rate(
                    start_date, end_date
                )
                
                # Top pages
                top_pages = dict(PageView.objects.filter(
                    timestamp__gte=start_date,
                    timestamp__lt=end_date
                ).values('path').annotate(
                    count=Count('id')
                ).order_by('-count')[:10].values_list('path', 'count'))
                
                # Top products
                top_products = dict(ProductView.objects.filter(
                    timestamp__gte=start_date,
                    timestamp__lt=end_date
                ).values('product__name').annotate(
                    count=Count('id')
                ).order_by('-count')[:10].values_list('product__name', 'count'))
                
                # Top countries
                top_countries = dict(Visitor.objects.filter(
                    last_visit__gte=start_date,
                    last_visit__lt=end_date
                ).exclude(country='').values('country').annotate(
                    count=Count('id')
                ).order_by('-count')[:10].values_list('country', 'count'))
                
                # Top referrers
                top_referrers = dict(PageView.objects.filter(
                    timestamp__gte=start_date,
                    timestamp__lt=end_date
                ).exclude(referrer='').values('referrer').annotate(
                    count=Count('id')
                ).order_by('-count')[:10].values_list('referrer', 'count'))
                
                # Create summary
                summary = AnalyticsSummary.objects.create(
                    period='daily',
                    date=target_date,
                    unique_visitors=unique_visitors,
                    total_page_views=total_page_views,
                    total_product_views=total_product_views,
                    avg_session_duration=avg_session_duration,
                    bounce_rate=bounce_rate,
                    top_pages=top_pages,
                    top_products=top_products,
                    top_countries=top_countries,
                    top_referrers=top_referrers
                )
                
                logger.info(f"Generated daily summary for {target_date}")
                return summary
                
        except Exception as e:
            logger.error(f"Error generating daily summary for {target_date}: {e}")
            return None
    
    @staticmethod
    def calculate_avg_session_duration(start_date, end_date):
        """Calculate average session duration in minutes"""
        try:
            # Group page views by session and calculate duration
            sessions = defaultdict(list)
            
            page_views = PageView.objects.filter(
                timestamp__gte=start_date,
                timestamp__lt=end_date
            ).order_by('session_id', 'timestamp')
            
            for pv in page_views:
                sessions[pv.session_id].append(pv.timestamp)
            
            # Calculate session durations
            durations = []
            for session_times in sessions.values():
                if len(session_times) > 1:
                    duration = (session_times[-1] - session_times[0]).total_seconds() / 60
                    durations.append(duration)
            
            return sum(durations) / len(durations) if durations else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating session duration: {e}")
            return 0.0
    
    @staticmethod
    def calculate_bounce_rate(start_date, end_date):
        """Calculate bounce rate (percentage of single-page sessions)"""
        try:
            # Count sessions with only one page view
            session_counts = PageView.objects.filter(
                timestamp__gte=start_date,
                timestamp__lt=end_date
            ).values('session_id').annotate(
                page_count=Count('id')
            )
            
            total_sessions = session_counts.count()
            single_page_sessions = session_counts.filter(page_count=1).count()
            
            if total_sessions > 0:
                return (single_page_sessions / total_sessions) * 100
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating bounce rate: {e}")
            return 0.0
    
    @staticmethod
    def get_visitor_journey(visitor_id, session_id=None):
        """Get the complete journey for a visitor"""
        try:
            filters = {'visitor_id': visitor_id}
            if session_id:
                filters['session_id'] = session_id
            
            # Get page views
            page_views = PageView.objects.filter(**filters).order_by('timestamp')
            
            # Get product views
            product_views = ProductView.objects.filter(**filters).order_by('timestamp')
            
            # Get events
            events = UserEvent.objects.filter(**filters).order_by('timestamp')
            
            # Combine and sort chronologically
            journey = []
            
            for pv in page_views:
                journey.append({
                    'type': 'page_view',
                    'timestamp': pv.timestamp,
                    'data': {
                        'path': pv.path,
                        'title': pv.page_title,
                        'referrer': pv.referrer,
                        'time_on_page': pv.time_on_page,
                        'scroll_depth': pv.scroll_depth
                    }
                })
            
            for pv in product_views:
                journey.append({
                    'type': 'product_view',
                    'timestamp': pv.timestamp,
                    'data': {
                        'product_name': pv.product.name,
                        'product_id': str(pv.product.id),
                        'time_on_page': pv.time_on_page,
                        'scroll_depth': pv.scroll_depth,
                        'images_viewed': len(pv.viewed_images),
                        'attachments_viewed': len(pv.viewed_attachments)
                    }
                })
            
            for event in events:
                journey.append({
                    'type': 'event',
                    'timestamp': event.timestamp,
                    'data': {
                        'event_type': event.event_type,
                        'page_path': event.page_path,
                        'element_text': event.element_text,
                        'product': event.product.name if event.product else None,
                        'metadata': event.metadata
                    }
                })
            
            # Sort by timestamp
            journey.sort(key=lambda x: x['timestamp'])
            
            return journey
            
        except Exception as e:
            logger.error(f"Error getting visitor journey: {e}")
            return []
    
    @staticmethod
    def get_real_time_stats():
        """Get real-time analytics statistics"""
        try:
            now = timezone.now()
            last_hour = now - timedelta(hours=1)
            last_24h = now - timedelta(hours=24)
            
            return {
                'visitors_online': Visitor.objects.filter(
                    last_visit__gte=now - timedelta(minutes=5)
                ).count(),
                'visitors_last_hour': Visitor.objects.filter(
                    last_visit__gte=last_hour
                ).count(),
                'page_views_last_hour': PageView.objects.filter(
                    timestamp__gte=last_hour
                ).count(),
                'product_views_last_hour': ProductView.objects.filter(
                    timestamp__gte=last_hour
                ).count(),
                'events_last_hour': UserEvent.objects.filter(
                    timestamp__gte=last_hour
                ).count(),
                'top_pages_last_hour': list(PageView.objects.filter(
                    timestamp__gte=last_hour
                ).values('path').annotate(
                    count=Count('id')
                ).order_by('-count')[:5])
            }
            
        except Exception as e:
            logger.error(f"Error getting real-time stats: {e}")
            return {}
    
    @staticmethod
    def update_all_product_popularity():
        """Update popularity stats for all products (for batch processing)"""
        try:
            products = Product.objects.all()
            updated_count = 0
            
            for product in products:
                AnalyticsService.update_product_popularity(product)
                updated_count += 1
            
            logger.info(f"Updated popularity stats for {updated_count} products")
            return updated_count
            
        except Exception as e:
            logger.error(f"Error updating all product popularity: {e}")
            return 0