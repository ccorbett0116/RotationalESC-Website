from django.core.cache import cache
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework import status
import time
from functools import wraps

def rate_limit(max_requests=100, time_window=3600, key_func=None):
    """
    Rate limiting decorator for analytics tracking endpoints.
    
    Args:
        max_requests (int): Maximum number of requests allowed
        time_window (int): Time window in seconds (default: 1 hour)
        key_func (callable): Function to generate cache key from request
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(request)
            else:
                # Default: use IP address as key
                ip_address = get_client_ip(request)
                cache_key = f"rate_limit:{view_func.__name__}:{ip_address}"
            
            # Get current request count
            current_requests = cache.get(cache_key, 0)
            
            # Check if limit exceeded
            if current_requests >= max_requests:
                return Response(
                    {'error': 'Rate limit exceeded. Too many requests.'}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Increment counter
            cache.set(cache_key, current_requests + 1, time_window)
            
            # Call the original view
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def get_client_ip(request):
    """Get the real client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or 'unknown'


def tracking_rate_limit(request):
    """Generate cache key for tracking endpoints based on IP and user agent"""
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')[:100]  # Limit length
    return f"tracking_rate_limit:{ip}:{hash(user_agent)}"


def admin_rate_limit(request):
    """Generate cache key for admin endpoints based on user ID"""
    if request.user.is_authenticated:
        return f"admin_rate_limit:{request.user.id}"
    else:
        return f"admin_rate_limit:anonymous:{get_client_ip(request)}"


class RateLimitMiddleware:
    """
    Middleware to apply rate limiting to specific URL patterns
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Apply rate limiting to analytics tracking endpoints
        if request.path.startswith('/api/analytics/track/'):
            # More lenient rate limiting for tracking (visitors need to track)
            if self.is_rate_limited(request, 'tracking', max_requests=500, time_window=3600):
                return HttpResponse('Rate limit exceeded', status=429)
        
        elif request.path.startswith('/api/analytics/admin-data/'):
            # Stricter rate limiting for admin data endpoints
            if self.is_rate_limited(request, 'admin_data', max_requests=100, time_window=3600):
                return HttpResponse('Rate limit exceeded', status=429)

        response = self.get_response(request)
        return response

    def is_rate_limited(self, request, endpoint_type, max_requests, time_window):
        """Check if request should be rate limited"""
        ip = get_client_ip(request)
        cache_key = f"rate_limit:{endpoint_type}:{ip}"
        
        current_requests = cache.get(cache_key, 0)
        if current_requests >= max_requests:
            return True
        
        cache.set(cache_key, current_requests + 1, time_window)
        return False