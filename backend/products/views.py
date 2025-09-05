from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Category, Product, ProductImage, Section, Manufacturer
from .serializers import (
    CategorySerializer, 
    ProductListSerializer, 
    ProductDetailSerializer,
    ProductImageUploadSerializer,
    SectionSerializer,
    ManufacturerSerializer,
    ManufacturerUploadSerializer,
    SectionWithManufacturersSerializer
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
    queryset = Product.objects.select_related('category').prefetch_related('images', 'specifications')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'in_stock']  # Removed 'page' to avoid conflict with pagination
    search_fields = ['name', 'description', 'tags', 'specifications__key', 'specifications__value']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']

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
            
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.select_related('category').prefetch_related('images', 'specifications')
    serializer_class = ProductDetailSerializer

@api_view(['GET'])
def product_search(request):
    """
    Advanced search endpoint for products
    """
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    
    products = Product.objects.select_related('category').prefetch_related('images')
    
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
        product = Product.objects.get(id=product_id)
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
    sections = Section.objects.prefetch_related('manufacturers').all()
    
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
            in_stock = row.get('in_stock', 'true').strip().lower() in ['true', '1', 'yes', 'y']
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
                product.in_stock = in_stock
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
                    in_stock=in_stock,
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
