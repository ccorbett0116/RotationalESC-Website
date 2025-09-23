from rest_framework import serializers
from .models import EquipmentCategory, Section, Manufacturer
import base64


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = ['id', 'name', 'slug', 'description', 'meta_title', 'meta_description', 'order', 'active']


class SectionSerializer(serializers.ModelSerializer):
    equipment_category = EquipmentCategorySerializer(read_only=True)
    equipment_category_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Section
        fields = ['id', 'label', 'description', 'equipment_category', 'equipment_category_id', 'created_at', 'updated_at']


class ManufacturerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Manufacturer
        fields = ['id', 'label', 'url', 'image_url', 'order', 'sections', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image_data:
            return obj.data_url
        return None


class ManufacturerUploadSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True)
    url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    sections = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Manufacturer
        fields = ['label', 'url', 'order', 'image_file', 'sections']

    def create(self, validated_data):
        image_file = validated_data.pop('image_file')
        sections_data = validated_data.pop('sections', [])
        
        # Convert image to binary data
        validated_data['image_data'] = image_file.read()
        validated_data['filename'] = image_file.name
        validated_data['content_type'] = image_file.content_type
        
        manufacturer = Manufacturer.objects.create(**validated_data)
        
        # Add sections
        if sections_data:
            manufacturer.sections.set(sections_data)
        
        return manufacturer


class SectionWithManufacturersSerializer(serializers.ModelSerializer):
    manufacturers = ManufacturerSerializer(many=True, read_only=True)
    equipment_category = EquipmentCategorySerializer(read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'label', 'description', 'equipment_category', 'manufacturers']