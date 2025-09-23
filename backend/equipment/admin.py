from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.utils.safestring import mark_safe
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


class ManufacturerAdminForm(forms.ModelForm):
    image_file = forms.ImageField(required=False, help_text="Upload an image file")
    
    class Meta:
        model = Manufacturer
        fields = ['label', 'url', 'image_file', 'sections', 'order']
        exclude = ['image_data', 'filename', 'content_type']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make URL field explicitly optional
        self.fields['url'].required = False
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
            raise forms.ValidationError("An image file is required for new manufacturers.")
        
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


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    form = ManufacturerAdminForm
    list_display = ['label', 'url', 'order', 'created_at']
    list_filter = ['sections', 'created_at']
    search_fields = ['label', 'url']
    filter_horizontal = ['sections']
    fields = ['label', 'url', 'image_file', 'sections', 'order', 'image_preview']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    ordering = ['label']
    
    def image_preview(self, obj):
        if obj and obj.image_data:
            return mark_safe(f'<img src="{obj.data_url}" style="max-height: 200px; max-width: 200px; border: 1px solid #ddd;" />')
        return "No image"
    image_preview.short_description = "Current Image"
