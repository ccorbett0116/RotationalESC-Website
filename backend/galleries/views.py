from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.utils.http import http_date
from django.utils import timezone
from datetime import timedelta
import hashlib
from .models import GalleryCategory, GalleryImage


@api_view(['GET'])
def gallery_categories(request):
    """
    Get all active gallery categories
    """
    categories = GalleryCategory.objects.filter(active=True).order_by('order', 'name')
    
    # Simple serializer inline since we just need basic data
    data = []
    for category in categories:
        data.append({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'description': category.description,
            'meta_title': category.meta_title,
            'meta_description': category.meta_description,
            'order': category.order,
        })
    
    return Response(data)


@api_view(['GET'])
def gallery_category_detail(request, slug):
    """
    Get a specific gallery category by slug with its images
    """
    try:
        category = GalleryCategory.objects.get(slug=slug, active=True)
    except GalleryCategory.DoesNotExist:
        return Response({'error': 'Gallery category not found'}, status=404)
    
    # Get images for this category
    images = GalleryImage.objects.filter(category=category).order_by('order', 'created_at')
    
    # Build response data
    category_data = {
        'id': category.id,
        'name': category.name,
        'slug': category.slug,
        'description': category.description,
        'meta_title': category.meta_title,
        'meta_description': category.meta_description,
        'images': []
    }
    
    # Add images data (without the binary data for performance)
    for image in images:
        category_data['images'].append({
            'id': image.id,
            'title': image.title,
            'description': image.description,
            'alt_text': image.alt_text,
            'order': image.order,
            'image_url': f'/api/galleries/{category.slug}/images/{image.id}/',
            'created_at': image.created_at,
        })
    
    return Response(category_data)


class GalleryImageView(APIView):
    """
    Serve individual gallery images with caching headers
    """
    def get(self, request, slug, image_id):
        try:
            # Get the category first to validate slug
            category = GalleryCategory.objects.get(slug=slug, active=True)
            image = GalleryImage.objects.get(id=image_id, category=category)
        except (GalleryCategory.DoesNotExist, GalleryImage.DoesNotExist):
            return Response({'error': 'Image not found'}, status=404)
        
        if not image.image_data:
            return Response({'error': 'No image data'}, status=404)
        
        # Generate ETag based on metadata only (never touch image_data)
        etag_data = f"{image.id}-{image.updated_at.isoformat()}"
        etag = hashlib.md5(etag_data.encode()).hexdigest()
        
        # Check if client has cached version
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if if_none_match == f'"{etag}"':
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        # Create response with image data
        response = HttpResponse(
            image.image_data,
            content_type=image.content_type or 'image/jpeg'
        )
        
        # Add caching headers
        max_age = 86400  # 24 hours
        expires = timezone.now() + timedelta(seconds=max_age)
        
        response['Cache-Control'] = f'public, max-age={max_age}, immutable'
        response['ETag'] = f'"{etag}"'
        response['Expires'] = http_date(expires.timestamp())
        response['Last-Modified'] = http_date(image.updated_at.timestamp())
        
        return response
