from django.db import models
from django.utils import timezone
from products.models import Product
import uuid


class Visitor(models.Model):
    """Track unique visitors with their IP and location data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    country = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    isp = models.CharField(max_length=200, blank=True)
    organization = models.CharField(max_length=200, blank=True)
    timezone_name = models.CharField(max_length=100, blank=True)
    first_visit = models.DateTimeField(default=timezone.now)
    last_visit = models.DateTimeField(auto_now=True)
    visit_count = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ['ip_address']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['first_visit']),
            models.Index(fields=['last_visit']),
        ]

    def __str__(self):
        return f"{self.ip_address} - {self.city}, {self.region} ({self.isp})"


class PageView(models.Model):
    """Track page views and user journeys"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='page_views')
    session_id = models.CharField(max_length=50, blank=True)
    path = models.CharField(max_length=500)
    full_url = models.URLField(max_length=1000)
    referrer = models.URLField(max_length=1000, blank=True)
    page_title = models.CharField(max_length=200, blank=True)
    load_time = models.PositiveIntegerField(null=True, blank=True, help_text="Page load time in milliseconds")
    scroll_depth = models.PositiveIntegerField(null=True, blank=True, help_text="Max scroll depth percentage")
    time_on_page = models.PositiveIntegerField(null=True, blank=True, help_text="Time spent on page in seconds")
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['visitor', 'timestamp']),
            models.Index(fields=['path']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['session_id']),
        ]

    def __str__(self):
        return f"{self.visitor.ip_address} - {self.path} at {self.timestamp}"


class ProductView(models.Model):
    """Track product-specific views and interactions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='product_views')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='analytics_views')
    session_id = models.CharField(max_length=50, blank=True)
    referrer = models.URLField(max_length=1000, blank=True)
    viewed_images = models.JSONField(default=list, help_text="List of image IDs viewed")
    viewed_attachments = models.JSONField(default=list, help_text="List of attachment IDs viewed")
    time_on_page = models.PositiveIntegerField(null=True, blank=True, help_text="Time spent viewing product in seconds")
    scroll_depth = models.PositiveIntegerField(null=True, blank=True, help_text="Max scroll depth percentage")
    added_to_cart = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['product', 'timestamp']),
            models.Index(fields=['visitor', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.visitor.ip_address} viewed {self.product.name} at {self.timestamp}"


class SearchQuery(models.Model):
    """Track search queries and their results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='searches')
    session_id = models.CharField(max_length=50, blank=True)
    query = models.CharField(max_length=500)
    results_count = models.PositiveIntegerField(default=0)
    clicked_results = models.JSONField(default=list, help_text="List of product IDs clicked from results")
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['query']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"'{self.query}' - {self.results_count} results"


class UserEvent(models.Model):
    """Track custom user events and interactions"""
    EVENT_TYPES = [
        ('click', 'Click'),
        ('scroll', 'Scroll'),
        ('download', 'Download'),
        ('form_submit', 'Form Submit'),
        ('video_play', 'Video Play'),
        ('image_view', 'Image View'),
        ('contact_form', 'Contact Form'),
        ('quote_request', 'Quote Request'),
        ('phone_click', 'Phone Click'),
        ('email_click', 'Email Click'),
        ('external_link', 'External Link'),
        ('cart_add', 'Add to Cart'),
        ('cart_remove', 'Remove from Cart'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='events')
    session_id = models.CharField(max_length=50, blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    element_id = models.CharField(max_length=100, blank=True)
    element_class = models.CharField(max_length=100, blank=True)
    element_text = models.CharField(max_length=200, blank=True)
    page_path = models.CharField(max_length=500)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    metadata = models.JSONField(default=dict, help_text="Additional event data")
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['visitor', 'timestamp']),
            models.Index(fields=['product', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.visitor.ip_address} - {self.event_type} on {self.page_path}"


class PopularProduct(models.Model):
    """Aggregate popular products with cached statistics"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='popularity_stats')
    total_views = models.PositiveIntegerField(default=0)
    unique_views = models.PositiveIntegerField(default=0)
    total_time_viewed = models.PositiveIntegerField(default=0, help_text="Total time in seconds")
    avg_time_viewed = models.FloatField(default=0.0, help_text="Average time in seconds")
    cart_additions = models.PositiveIntegerField(default=0)
    conversion_rate = models.FloatField(default=0.0, help_text="Cart additions / unique views")
    purchases = models.PositiveIntegerField(default=0, help_text="Actual purchases")
    purchase_rate = models.FloatField(default=0.0, help_text="Purchases / unique views")
    last_viewed = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_views', '-unique_views']
        indexes = [
            models.Index(fields=['total_views']),
            models.Index(fields=['unique_views']),
            models.Index(fields=['conversion_rate']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.total_views} views"


class AnalyticsSummary(models.Model):
    """Daily/weekly/monthly analytics summaries for fast dashboard loading"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    date = models.DateField()
    unique_visitors = models.PositiveIntegerField(default=0)
    total_page_views = models.PositiveIntegerField(default=0)
    total_product_views = models.PositiveIntegerField(default=0)
    avg_session_duration = models.FloatField(default=0.0, help_text="Average session duration in minutes")
    bounce_rate = models.FloatField(default=0.0, help_text="Percentage of single-page sessions")
    top_pages = models.JSONField(default=dict, help_text="Top pages with view counts")
    top_products = models.JSONField(default=dict, help_text="Top products with view counts")
    top_countries = models.JSONField(default=dict, help_text="Top countries with visitor counts")
    top_referrers = models.JSONField(default=dict, help_text="Top referrers with counts")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['period', 'date']
        indexes = [
            models.Index(fields=['period', 'date']),
        ]

    def __str__(self):
        return f"{self.get_period_display()} summary for {self.date}"