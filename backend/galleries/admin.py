from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from django.utils.html import format_html
from .models import GalleryCategory, GalleryImage


@admin.register(GalleryCategory)
class GalleryCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'active', 'order', 'images_count', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    readonly_fields = ['created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']
    
    def images_count(self, obj):
        count = obj.images.count()
        return format_html(
            '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">{} images</span>',
            count
        )
    images_count.short_description = "Images"


class GalleryImageAdminForm(forms.ModelForm):
    image_file = forms.ImageField(required=False, help_text="Upload an image file")
    
    class Meta:
        model = GalleryImage
        fields = ['category', 'title', 'description', 'image_file', 'alt_text', 'order']
        exclude = ['image_data', 'filename', 'content_type']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If this is an existing instance with image data, show a preview
        if self.instance and self.instance.pk and self.instance.image_data:
            self.fields['current_image'] = forms.CharField(
                required=False,
                widget=forms.HiddenInput(),
                initial="has_image"
            )
    
    def clean(self):
        cleaned_data = super().clean()
        image_file = cleaned_data.get('image_file')
        
        # For new instances, require an image file
        if not self.instance.pk and not image_file:
            raise forms.ValidationError("An image file is required for new gallery images.")
        
        # For existing instances without image_data, require an image file
        if self.instance.pk and not self.instance.image_data and not image_file:
            raise forms.ValidationError("An image file is required.")
            
        return cleaned_data
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Handle file upload
        image_file = self.cleaned_data.get('image_file')
        if image_file:
            # Read the uploaded file and store as binary data
            instance.image_data = image_file.read()
            instance.filename = image_file.name
            instance.content_type = image_file.content_type
        
        if commit:
            instance.save()
        return instance


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    form = GalleryImageAdminForm
    list_display = ['title', 'category', 'order', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'description', 'alt_text', 'category__name']
    fields = ['category', 'title', 'description', 'image_file', 'alt_text', 'order', 'image_preview']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    ordering = ['category__order', 'order', 'created_at']
    
    def image_preview(self, obj):
        if obj and obj.image_data:
            return mark_safe(f'<img src="{obj.data_url}" style="max-height: 200px; max-width: 200px; border: 1px solid #ddd;" />')
        return "No image"
    image_preview.short_description = "Current Image"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')
