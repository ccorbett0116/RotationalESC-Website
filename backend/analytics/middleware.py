import json
import requests
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from django.core.cache import cache
from .models import Visitor, PageView
import logging
import uuid

logger = logging.getLogger(__name__)


class AnalyticsMiddleware(MiddlewareMixin):
    """Middleware to track visitor analytics and page views"""
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.get_response = get_response

    def process_request(self, request):
        """Process incoming requests for analytics tracking"""
        # Skip analytics for admin, static files, and non-analytics API calls
        skip_paths = ['/admin/', '/static/', '/media/']
        api_skip_paths = ['/api/products/', '/api/categories/', '/api/company/', '/api/contact/']
        
        # Skip non-analytics API calls but allow analytics tracking endpoints
        if (any(request.path.startswith(path) for path in skip_paths) or 
            any(request.path.startswith(path) for path in api_skip_paths)):
            return None

        # Analytics API calls need visitor tracking for the endpoints to work
        is_analytics_api = request.path.startswith('/api/analytics/')
        
        # Get visitor IP address
        ip_address = self.get_client_ip(request)
        if not ip_address:
            return None

        # Get or create visitor (don't count visits for analytics API calls)
        visitor = self.get_or_create_visitor(ip_address, request, count_visit=not is_analytics_api)
        
        # Generate session ID if not exists
        if not request.session.get('analytics_session_id'):
            request.session['analytics_session_id'] = str(uuid.uuid4())

        # Store visitor in request for use in views
        request.visitor = visitor
        request.analytics_session_id = request.session['analytics_session_id']

        return None

    def process_response(self, request, response):
        """Process response to track page views"""
        # Skip if no visitor or not a successful response
        if not hasattr(request, 'visitor') or response.status_code != 200:
            return response

        # Skip API endpoints except product details
        if request.path.startswith('/api/') and not request.path.startswith('/api/products/'):
            return response

        # Track page view
        self.track_page_view(request, response)

        return response

    def get_client_ip(self, request):
        """Get the real client IP address"""
        # Check for IP in headers (for proxy/load balancer setups)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Filter out local/private IPs in development
        if ip and not self.is_private_ip(ip):
            return ip
        return ip  # Return anyway for development/testing

    def is_private_ip(self, ip):
        """Check if IP is private/local"""
        private_ips = ['127.0.0.1', 'localhost', '::1']
        if ip in private_ips:
            return True
        
        # Check private IP ranges
        import ipaddress
        try:
            ip_obj = ipaddress.ip_address(ip)
            return ip_obj.is_private
        except ValueError:
            return True

    def get_or_create_visitor(self, ip_address, request, count_visit=True):
        """Get existing visitor or create new one with location data"""
        try:
            visitor = Visitor.objects.get(ip_address=ip_address)
            
            # Only increment visit count if this is a new session AND we should count visits
            if count_visit:
                session_id = request.session.get('analytics_session_id')
                if not session_id or not request.session.get('visit_counted'):
                    visitor.visit_count += 1
                    request.session['visit_counted'] = True
            
            # Always update last visit time
            visitor.last_visit = timezone.now()
            visitor.save()
            return visitor
        except Visitor.DoesNotExist:
            # Create new visitor with location data
            visitor = self.create_visitor_with_location(ip_address, request)
            # Mark as counted for this session (only if counting visits)
            if count_visit:
                request.session['visit_counted'] = True
            return visitor

    def create_visitor_with_location(self, ip_address, request):
        """Create a new visitor with location and ISP data"""
        visitor_data = {
            'ip_address': ip_address,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:2000],  # Limit length
        }

        # Get location data from IP (with caching)
        location_data = self.get_ip_location(ip_address)
        if location_data:
            visitor_data.update(location_data)

        return Visitor.objects.create(**visitor_data)

    def get_ip_location(self, ip_address):
        """Get location and ISP data for an IP address"""
        # Check cache first
        cache_key = f"ip_location_{ip_address}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        # Skip location lookup for private IPs
        if self.is_private_ip(ip_address):
            return {
                'country': 'Local',
                'region': 'Local',
                'city': 'Local',
                'isp': 'Local Network',
                'organization': 'Local',
                'timezone_name': 'UTC'
            }

        # Try multiple IP geolocation services
        location_data = self.try_ip_api(ip_address) or self.try_ipinfo_io(ip_address)
        
        if location_data:
            # Cache for 24 hours
            cache.set(cache_key, location_data, 86400)
            
        return location_data or {}

    def try_ip_api(self, ip_address):
        """Try ip-api.com for IP geolocation"""
        try:
            # ip-api.com allows 1000 requests per month for free
            response = requests.get(
                f'http://ip-api.com/json/{ip_address}',
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return {
                        'country': data.get('country', '')[:100],
                        'region': data.get('regionName', '')[:100],
                        'city': data.get('city', '')[:100],
                        'isp': data.get('isp', '')[:200],
                        'organization': data.get('org', '')[:200],
                        'timezone_name': data.get('timezone', '')[:100]
                    }
        except Exception as e:
            logger.warning(f"IP-API lookup failed for {ip_address}: {e}")
        return None

    def try_ipinfo_io(self, ip_address):
        """Try ipinfo.io for IP geolocation (backup)"""
        try:
            # ipinfo.io allows 50,000 requests per month for free
            response = requests.get(
                f'https://ipinfo.io/{ip_address}/json',
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                location = data.get('loc', '').split(',')
                return {
                    'country': data.get('country', '')[:100],
                    'region': data.get('region', '')[:100], 
                    'city': data.get('city', '')[:100],
                    'isp': data.get('org', '')[:200],
                    'organization': data.get('org', '')[:200],
                    'timezone_name': data.get('timezone', '')[:100]
                }
        except Exception as e:
            logger.warning(f"IPInfo lookup failed for {ip_address}: {e}")
        return None

    def track_page_view(self, request, response):
        """Track a page view"""
        try:
            # Prevent duplicate page views within the same session for the same path
            # within a short time window (to handle React strict mode and rapid refreshes)
            session_key = f"pageview_{request.analytics_session_id}_{request.path}"
            last_view_time = request.session.get(session_key)
            current_time = timezone.now().timestamp()
            
            # Only track if last view was more than 5 seconds ago or doesn't exist
            if last_view_time and (current_time - last_view_time) < 5:
                return
            
            page_view_data = {
                'visitor': request.visitor,
                'session_id': getattr(request, 'analytics_session_id', ''),
                'path': request.path,
                'full_url': request.build_absolute_uri(),
                'referrer': request.META.get('HTTP_REFERER', '')[:1000],
            }

            # Get page title from response if it's HTML
            content_type = response.get('Content-Type', '')
            if 'text/html' in content_type:
                page_view_data['page_title'] = self.extract_page_title(response.content)

            PageView.objects.create(**page_view_data)
            
            # Update the session timestamp for this page view
            request.session[session_key] = current_time

        except Exception as e:
            logger.error(f"Failed to track page view: {e}")

    def extract_page_title(self, html_content):
        """Extract page title from HTML content"""
        try:
            if isinstance(html_content, bytes):
                html_content = html_content.decode('utf-8', errors='ignore')
            
            import re
            title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()[:200]  # Limit length
                # Clean up title (remove extra whitespace, HTML entities)
                title = re.sub(r'\s+', ' ', title)
                return title
        except Exception:
            pass
        return ''