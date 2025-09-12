from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAnalyticsAdmin(BasePermission):
    """
    Custom permission class for analytics data access.
    Only allows access to staff users (Django admin users).
    """
    
    def has_permission(self, request, view):
        """
        Check if the user has permission to access analytics data
        """
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be staff (Django admin user)
        if not request.user.is_staff:
            return False
        
        # Optionally, can add additional checks here like:
        # - Specific group membership
        # - Custom user permissions
        # - IP address restrictions
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Object-level permissions for analytics data
        """
        return self.has_permission(request, view)


class IsTrackingAllowed(BasePermission):
    """
    Permission class for tracking endpoints.
    These should be publicly accessible for anonymous visitor tracking,
    but can include rate limiting or other restrictions.
    """
    
    def has_permission(self, request, view):
        """
        Allow tracking for all users, but can add restrictions here
        """
        # Always allow tracking (for anonymous visitor tracking)
        # Can add restrictions here like:
        # - Rate limiting per IP
        # - Blacklist certain IPs
        # - Require valid referrer
        
        # Example: Check if request is from allowed domains
        # referrer = request.META.get('HTTP_REFERER', '')
        # if referrer and not any(domain in referrer for domain in ALLOWED_DOMAINS):
        #     return False
        
        return True


class IsStaffOrReadOnlyForTracking(BasePermission):
    """
    Custom permission that allows:
    - Anyone to POST to tracking endpoints (for visitor tracking)
    - Only staff to GET analytics data
    """
    
    def has_permission(self, request, view):
        # If it's a tracking POST request, allow it
        if request.method == 'POST' and 'track' in request.path:
            return True
        
        # For all other requests (especially GET requests for data), require staff
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_staff