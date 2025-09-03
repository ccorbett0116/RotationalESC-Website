from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductSpecification
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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category', 
            'in_stock', 'tags_list', 'primary_image'
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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category', 
            'in_stock', 'tags_list', 'images', 
            'specifications', 'created_at', 'updated_at'
        ]
