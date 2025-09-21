from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch

from .models import EquipmentCategory, Section, Manufacturer
from .serializers import (
    EquipmentCategorySerializer,
    SectionSerializer,
    ManufacturerSerializer,
    ManufacturerUploadSerializer,
    SectionWithManufacturersSerializer
)


class EquipmentCategoryListView(APIView):
    """
    List all active equipment categories
    """
    def get(self, request, format=None):
        categories = EquipmentCategory.objects.filter(active=True).order_by('order', 'name')
        serializer = EquipmentCategorySerializer(categories, many=True)
        return Response(serializer.data)


@api_view(['GET'])
def equipment_category_detail(request, slug):
    """
    Get a specific equipment category by slug with its sections and manufacturers
    """
    try:
        category = EquipmentCategory.objects.get(slug=slug, active=True)
    except EquipmentCategory.DoesNotExist:
        return Response({'error': 'Equipment category not found'}, status=404)
    
    # Get sections for this category with their manufacturers
    sections = Section.objects.filter(equipment_category=category).prefetch_related(
        Prefetch(
            'manufacturers',
            queryset=Manufacturer.objects.order_by('order')
        )
    )
    
    # Build response data
    category_data = {
        'id': category.id,
        'name': category.name,
        'slug': category.slug,
        'description': category.description,
        'meta_title': category.meta_title,
        'meta_description': category.meta_description,
        'sections': SectionWithManufacturersSerializer(sections, many=True).data
    }
    
    return Response(category_data)


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
    Optionally filter by equipment category slug
    """
    sections = Section.objects.prefetch_related(
        Prefetch(
            'manufacturers',
            queryset=Manufacturer.objects.order_by('order')
        )
    ).select_related('equipment_category').all()
    
    # Filter by equipment category slug if provided
    category_slug = request.GET.get('category_slug') or request.GET.get('page')  # Support legacy 'page' param
    if category_slug:
        sections = sections.filter(equipment_category__slug=category_slug)
    
    serializer = SectionWithManufacturersSerializer(sections, many=True)
    return Response(serializer.data)