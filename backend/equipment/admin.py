from django.contrib import admin
from django.utils.html import format_html
from .models import EquipmentCategory, Section, Manufacturer


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'active', 'order', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description', 'active', 'order')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['label', 'equipment_category', 'created_at']
    list_filter = ['equipment_category', 'created_at']
    search_fields = ['label', 'description']
    ordering = ['equipment_category__order', 'label']


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ['label', 'url', 'image_preview', 'order', 'created_at']
    list_filter = ['sections', 'created_at']
    search_fields = ['label', 'url']
    filter_horizontal = ['sections']
    ordering = ['label']
    
    def image_preview(self, obj):
        if obj.image_data:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: contain;" />',
                obj.data_url
            )
        return "No image"
    image_preview.short_description = "Image Preview"