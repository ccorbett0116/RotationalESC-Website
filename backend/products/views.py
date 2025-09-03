from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer, 
    ProductListSerializer, 
    ProductDetailSerializer,
    ProductImageUploadSerializer
)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.select_related('category').prefetch_related('images')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'in_stock']
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Custom filtering
        category_name = self.request.query_params.get('category_name', None)
        if category_name and category_name != 'all':
            queryset = queryset.filter(category__name=category_name)
        
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
