from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Prefetch
import logging
import gc

logger = logging.getLogger(__name__)
from .models import Category, Product, ProductImage, Section, Manufacturer, Gallery, NewGallery, ProductAttachment
from .serializers import (
    CategorySerializer, 
    ProductListSerializer, 
    ProductDetailSerializer,
    ProductImageUploadSerializer,
    SectionSerializer,
    ManufacturerSerializer,
    ManufacturerUploadSerializer,
    SectionWithManufacturersSerializer,
    GallerySerializer,
    NewGallerySerializer
)

class CategoryListView(APIView):
    """
    List all categories without pagination
    """
    def get(self, request, format=None):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(active=True).select_related('category')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']  # Removed 'page' to avoid conflict with pagination
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['name', 'price', 'created_at', 'order']
    ordering = ['name']

    def list(self, request, *args, **kwargs):
        logger.info(f"ProductListView called. Memory before: {gc.get_stats()}")
        response = super().list(request, *args, **kwargs)
        logger.info(f"ProductListView finished. Memory after: {gc.get_stats()}")
        gc.collect()  # Force garbage collection
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Custom filtering
        category_name = self.request.query_params.get('category_name', None)
        if category_name and category_name != 'all':
            queryset = queryset.filter(category__name=category_name)
        
        # Product page filtering (use a different parameter name to avoid pagination conflict)
        product_page = self.request.query_params.get('product_page', None)
        if product_page and product_page != 'all':
            queryset = queryset.filter(page=product_page)
        
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Handle ordering by 'order' field with null values last
        ordering = self.request.query_params.get('ordering', None)
        if ordering == 'order':
            from django.db.models import F
            queryset = queryset.order_by(F('order').asc(nulls_last=True))
        elif ordering == '-order':
            from django.db.models import F
            queryset = queryset.order_by(F('order').desc(nulls_last=True))
            
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True).select_related('category').prefetch_related('images', 'specifications', 'attachments')
    serializer_class = ProductDetailSerializer

@api_view(['GET'])
def related_products(request, product_id):
    """
    Get related products from the same category as the specified product
    """
    try:
        product = Product.objects.filter(active=True).get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get products from the same category, excluding the current product
    related = Product.objects.filter(
        active=True,
        category=product.category
    ).exclude(id=product_id).select_related('category').prefetch_related('images')
    
    # Randomly order the results and limit to 3
    related = related.order_by('?')[:3]
    
    serializer = ProductListSerializer(related, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def product_search(request):
    """
    Advanced search endpoint for products
    """
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    
    products = Product.objects.filter(active=True).select_related('category').prefetch_related('images')
    
    if query:
        products = products.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query) |
            Q(tags__icontains=query)
        )
    
    if category and category != 'all':
        products = products.filter(category__name=category)
    
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
def upload_product_image(request, product_id):
    """
    Upload an image for a specific product
    """
    try:
        product = Product.objects.filter(active=True).get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ProductImageUploadSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(product=product)
        return Response(
            {'message': 'Image uploaded successfully'}, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SectionListView(APIView):
    """
    List all sections without pagination
    """
    def get(self, request, format=None):
        sections = Section.objects.all()
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = SectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer


class ManufacturerListView(generics.ListAPIView):
    queryset = Manufacturer.objects.prefetch_related('sections')
    serializer_class = ManufacturerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['sections']
    search_fields = ['label']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by section if provided
        section_id = self.request.query_params.get('section', None)
        if section_id:
            queryset = queryset.filter(sections__id=section_id)
            
        return queryset


class ManufacturerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Manufacturer.objects.prefetch_related('sections')
    serializer_class = ManufacturerSerializer


@api_view(['POST'])
def upload_manufacturer(request):
    """
    Upload a manufacturer with image
    """
    serializer = ManufacturerUploadSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'message': 'Manufacturer created successfully'}, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def sections_with_manufacturers(request):
    """
    Get all sections with their associated manufacturers
    Optionally filter by page parameter
    """
    sections = Section.objects.prefetch_related(
        Prefetch(
            'manufacturers',
            queryset=Manufacturer.objects.order_by('order')
        )
    ).all()
    
    # Filter by page if provided
    page = request.GET.get('page')
    if page:
        sections = sections.filter(page=page)
    
    serializer = SectionWithManufacturersSerializer(sections, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def import_products_csv(request):
    """
    Import products from CSV file via API
    """
    from django.db import transaction
    from decimal import Decimal, InvalidOperation
    import csv
    import io
    
    products_file = request.FILES.get('products_csv_file')
    specs_file = request.FILES.get('specifications_csv_file')
    update_existing = request.data.get('update_existing', 'false').lower() == 'true'
    
    if not products_file:
        return Response(
            {'error': 'Products CSV file is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            # Import products
            products_imported = _import_products_from_csv_api(products_file, update_existing)
            
            # Import specifications if provided
            specs_imported = 0
            if specs_file:
                specs_imported = _import_specifications_from_csv_api(specs_file)
            
            return Response({
                'message': f'Successfully imported {products_imported} products and {specs_imported} specifications',
                'products_imported': products_imported,
                'specifications_imported': specs_imported
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': f'Import failed: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


def _import_products_from_csv_api(csv_file, update_existing):
    """Import products from CSV file for API"""
    from decimal import Decimal, InvalidOperation
    
    imported_count = 0
    decoded_file = csv_file.read().decode('utf-8')
    io_string = io.StringIO(decoded_file)
    reader = csv.DictReader(io_string)
    
    for row in reader:
        try:
            name = row['name'].strip()
            description = row['description'].strip()
            category_name = row['category'].strip()
            page = row['page'].strip()
            
            # Validate page value
            valid_pages = ['seals', 'packing', 'pumps', 'general']
            if page not in valid_pages:
                raise ValueError(f'Invalid page value "{page}". Must be one of: {", ".join(valid_pages)}')
            
            # Parse price
            try:
                price_str = row['price'].strip().replace('$', '').replace(',', '')
                price = Decimal(price_str)
            except (InvalidOperation, ValueError):
                raise ValueError(f'Invalid price "{row["price"]}" for product "{name}"')
            
            # Get or create category
            from .models import Category, Product, ProductSpecification
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={'description': f'Category for {category_name}'}
            )
            
            # Optional fields
            tags = row.get('tags', '').strip()
            
            # Check if product exists
            product_exists = Product.objects.filter(name=name).exists()
            
            if product_exists and not update_existing:
                continue  # Skip existing products
            
            if product_exists and update_existing:
                # Update existing product
                product = Product.objects.get(name=name)
                product.description = description
                product.price = price
                product.category = category
                product.page = page
                product.tags = tags
                product.save()
            else:
                # Create new product
                Product.objects.create(
                    name=name,
                    description=description,
                    price=price,
                    category=category,
                    page=page,
                    tags=tags
                )
            
            imported_count += 1
            
        except Exception as e:
            raise Exception(f'Error processing row with product "{row.get("name", "Unknown")}": {str(e)}')
    
    return imported_count


def _import_specifications_from_csv_api(csv_file):
    """Import product specifications from CSV file for API"""
    from .models import Product, ProductSpecification
    
    imported_count = 0
    decoded_file = csv_file.read().decode('utf-8')
    io_string = io.StringIO(decoded_file)
    reader = csv.DictReader(io_string)
    
    for row in reader:
        try:
            product_name = row['product_name'].strip()
            key = row['key'].strip()
            value = row['value'].strip()
            order = int(row.get('order', 0))
            
            try:
                product = Product.objects.get(name=product_name)
            except Product.DoesNotExist:
                continue  # Skip if product doesn't exist
            
            # Create or update specification
            ProductSpecification.objects.update_or_create(
                product=product,
                key=key,
                defaults={'value': value, 'order': order}
            )
            
            imported_count += 1
            
        except Exception as e:
            continue  # Skip problematic rows
    
    return imported_count


class GalleryListView(APIView):
    """
    List all gallery images without pagination
    """
    def get(self, request):
        # Get only metadata fields, completely avoid image_data
        gallery_items = Gallery.objects.only(
            'id', 'title', 'description', 'filename', 'content_type', 
            'alt_text', 'order', 'created_at', 'updated_at'
        )
        serializer = GallerySerializer(gallery_items, many=True)
        return Response(serializer.data)

class NewGalleryListView(APIView):
    """
    List all gallery images without pagination
    """
    def get(self, request):
        # Get only metadata fields, completely avoid image_data
        gallery_items = NewGallery.objects.only(
            'id', 'title', 'description', 'filename', 'content_type', 
            'alt_text', 'order', 'created_at', 'updated_at'
        )
        serializer = NewGallerySerializer(gallery_items, many=True)
        return Response(serializer.data)


class GalleryImageView(APIView):
    """
    Serve individual gallery images with caching headers
    """
    def get(self, request, image_id):
        from django.http import HttpResponse
        from django.core.cache import cache
        from django.utils.http import http_date
        from django.utils import timezone
        from datetime import timedelta
        import hashlib
        
        try:
            gallery_item = Gallery.objects.get(id=image_id)
        except Gallery.DoesNotExist:
            return Response({'error': 'Image not found'}, status=404)
        
        if not gallery_item.image_data:
            return Response({'error': 'No image data'}, status=404)
        
        # Generate ETag based on metadata only (never touch image_data)
        etag_data = f"{gallery_item.id}-{gallery_item.updated_at.isoformat()}"
        etag = hashlib.md5(etag_data.encode()).hexdigest()
        
        # Check if client has cached version
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if if_none_match == f'"{etag}"':
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        # Create response with image data
        response = HttpResponse(
            gallery_item.image_data,
            content_type=gallery_item.content_type or 'image/jpeg'
        )
        
        # Add caching headers
        max_age = 86400  # 24 hours
        expires = timezone.now() + timedelta(seconds=max_age)
        
        response['Cache-Control'] = f'public, max-age={max_age}, immutable'
        response['ETag'] = f'"{etag}"'
        response['Expires'] = http_date(expires.timestamp())
        response['Last-Modified'] = http_date(gallery_item.updated_at.timestamp())
        
        return response


class ProductImageView(APIView):
    """
    Serve individual product images with caching headers
    """
    def get(self, request, product_id, image_id):
        from django.http import HttpResponse
        from django.utils.http import http_date
        from django.utils import timezone
        from datetime import timedelta
        import hashlib
        
        try:
            product_image = ProductImage.objects.get(
                id=image_id,
                product_id=product_id
            )
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=404)
        
        if not product_image.image_data:
            return Response({'error': 'No image data'}, status=404)
        
        # Generate ETag based on metadata only (never touch image_data)
        etag_data = f"{product_image.id}-{product_image.created_at.isoformat()}"
        etag = hashlib.md5(etag_data.encode()).hexdigest()
        
        # Check if client has cached version
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if if_none_match == f'"{etag}"':
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        # Create response with image data
        response = HttpResponse(
            product_image.image_data,
            content_type=product_image.content_type or 'image/jpeg'
        )
        
        # Add caching headers
        max_age = 86400  # 24 hours
        expires = timezone.now() + timedelta(seconds=max_age)
        
        response['Cache-Control'] = f'public, max-age={max_age}, immutable'
        response['ETag'] = f'"{etag}"'
        response['Expires'] = http_date(expires.timestamp())
        response['Last-Modified'] = http_date(product_image.created_at.timestamp())
        
        return response


class NewGalleryImageView(APIView):
    """
    Serve individual new gallery images with caching headers
    """
    def get(self, request, image_id):
        from django.http import HttpResponse
        from django.core.cache import cache
        from django.utils.http import http_date
        from django.utils import timezone
        from datetime import timedelta
        import hashlib
        
        try:
            gallery_item = NewGallery.objects.get(id=image_id)
        except NewGallery.DoesNotExist:
            return Response({'error': 'Image not found'}, status=404)
        
        if not gallery_item.image_data:
            return Response({'error': 'No image data'}, status=404)
        
        # Generate ETag based on metadata only (never touch image_data)
        etag_data = f"{gallery_item.id}-{gallery_item.updated_at.isoformat()}"
        etag = hashlib.md5(etag_data.encode()).hexdigest()
        
        # Check if client has cached version
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if if_none_match == f'"{etag}"':
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        # Create response with image data
        response = HttpResponse(
            gallery_item.image_data,
            content_type=gallery_item.content_type or 'image/jpeg'
        )
        
        # Add caching headers
        max_age = 86400  # 24 hours
        expires = timezone.now() + timedelta(seconds=max_age)
        
        response['Cache-Control'] = f'public, max-age={max_age}, immutable'
        response['ETag'] = f'"{etag}"'
        response['Expires'] = http_date(expires.timestamp())
        response['Last-Modified'] = http_date(gallery_item.updated_at.timestamp())
        
        return response


class ProductImageView(APIView):
    """
    Serve individual product images with caching headers
    """
    def get(self, request, product_id, image_id):
        from django.http import HttpResponse
        from django.utils.http import http_date
        from django.utils import timezone
        from datetime import timedelta
        import hashlib
        
        try:
            product_image = ProductImage.objects.get(
                id=image_id,
                product_id=product_id
            )
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=404)
        
        if not product_image.image_data:
            return Response({'error': 'No image data'}, status=404)
        
        # Generate ETag based on metadata only (never touch image_data)
        etag_data = f"{product_image.id}-{product_image.created_at.isoformat()}"
        etag = hashlib.md5(etag_data.encode()).hexdigest()
        
        # Check if client has cached version
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if if_none_match == f'"{etag}"':
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        # Create response with image data
        response = HttpResponse(
            product_image.image_data,
            content_type=product_image.content_type or 'image/jpeg'
        )
        
        # Add caching headers
        max_age = 86400  # 24 hours
        expires = timezone.now() + timedelta(seconds=max_age)
        
        response['Cache-Control'] = f'public, max-age={max_age}, immutable'
        response['ETag'] = f'"{etag}"'
        response['Expires'] = http_date(expires.timestamp())
        response['Last-Modified'] = http_date(product_image.created_at.timestamp())
        
        return response