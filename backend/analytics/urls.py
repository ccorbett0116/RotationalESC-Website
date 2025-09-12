from django.urls import path, include
from django.contrib.admin.views.decorators import staff_member_required
from . import views
from .admin import dashboard_admin

# Public tracking endpoints (no authentication required)
tracking_patterns = [
    path('track/product/', views.track_product_view, name='track_product_view'),
    path('track/search/', views.track_search, name='track_search'),
    path('track/event/', views.track_event, name='track_event'),
    path('track/page/', views.update_page_metrics, name='update_page_metrics'),
]

# Admin-only analytics data endpoints (require admin authentication)
admin_data_patterns = [
    path('popular-products/', views.get_popular_products, name='get_popular_products'),
    path('dashboard/', views.get_analytics_dashboard, name='get_analytics_dashboard'),
]

# Admin dashboard routes (require staff authentication)
admin_dashboard_patterns = [
    path('dashboard/', staff_member_required(dashboard_admin.analytics_dashboard), name='analytics_dashboard'),
    path('visitor-analytics/', staff_member_required(dashboard_admin.visitor_analytics), name='visitor_analytics'),
    path('product-analytics/', staff_member_required(dashboard_admin.product_analytics), name='product_analytics'),
    path('real-time/', staff_member_required(dashboard_admin.real_time_analytics), name='real_time_analytics'),
    path('dashboard-data/', staff_member_required(dashboard_admin.dashboard_data_api), name='dashboard_data_api'),
]

urlpatterns = [
    # Public tracking endpoints - no authentication required
    *tracking_patterns,
    
    # Admin data endpoints - admin authentication required  
    path('admin-data/', include(admin_data_patterns)),
    
    # Admin dashboard routes - staff authentication required
    path('admin/', include(admin_dashboard_patterns)),
]