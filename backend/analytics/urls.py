from django.urls import path, include
from . import views

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

urlpatterns = [
    # Public tracking endpoints - no authentication required
    *tracking_patterns,
    
    # Admin data endpoints - admin authentication required  
    path('admin-data/', include(admin_data_patterns)),
]