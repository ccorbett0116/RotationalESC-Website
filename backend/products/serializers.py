from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductSpecification, Section, Manufacturer
import base64

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    is_primary = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'filename', 'content_type', 'alt_text', 'is_primary', 'order']
        extra_kwargs = {
            'image_data': {'write_only': True}
        }
    
    def get_image_url(self, obj):
        return obj.data_url
    
    def get_is_primary(self, obj):
        return obj.is_primary

class ProductImageUploadSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True)
    
    class Meta:
        model = ProductImage
        fields = ['image_file', 'alt_text', 'order']
    
    def create(self, validated_data):
        image_file = validated_data.pop('image_file')
        
        # Read the image file and convert to bytes
        image_data = image_file.read()
        
        # Create the ProductImage instance
        product_image = ProductImage.objects.create(
            image_data=image_data,
            filename=image_file.name,
            content_type=image_file.content_type,
            **validated_data
        )
        
        return product_image

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['id', 'key', 'value', 'order']

class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    tags_list = serializers.ReadOnlyField()
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category',
            'in_stock', 'quantity', 'is_available', 'tags_list', 'primary_image', 'specifications'
        ]

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(order=0).first()
        if primary_image:
            return primary_image.data_url
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    tags_list = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category',
            'in_stock', 'quantity', 'is_available', 'tags_list', 'images', 
            'specifications', 'created_at', 'updated_at'
        ]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'label', 'created_at', 'updated_at']


class ManufacturerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    sections = SectionSerializer(many=True, read_only=True)
    section_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Section.objects.all(), 
        write_only=True, 
        source='sections'
    )
    
    class Meta:
        model = Manufacturer
        fields = [
            'id', 'label', 'url', 'image_url', 'filename', 
            'sections', 'section_ids', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'image_data': {'write_only': True}
        }
    
    def get_image_url(self, obj):
        return obj.data_url


class ManufacturerUploadSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True)
    section_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Section.objects.all(), 
        write_only=True, 
        source='sections'
    )
    
    class Meta:
        model = Manufacturer
        fields = ['label', 'url', 'image_file', 'section_ids']
    
    def create(self, validated_data):
        image_file = validated_data.pop('image_file')
        sections = validated_data.pop('sections', [])
        
        # Read the image file and convert to bytes
        image_data = image_file.read()
        
        # Create the Manufacturer instance
        manufacturer = Manufacturer.objects.create(
            image_data=image_data,
            filename=image_file.name,
            content_type=image_file.content_type,
            **validated_data
        )
        
        # Set the sections
        manufacturer.sections.set(sections)
        
        return manufacturer


class SectionWithManufacturersSerializer(serializers.ModelSerializer):
    manufacturers = ManufacturerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'label', 'page', 'manufacturers', 'created_at', 'updated_at']
