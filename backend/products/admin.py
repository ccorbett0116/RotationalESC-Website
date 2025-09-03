from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from .models import Category, Product, ProductImage, ProductSpecification

class ProductImageAdminForm(forms.ModelForm):
    image_file = forms.ImageField(required=False, help_text="Upload an image file")
    
    class Meta:
        model = ProductImage
        fields = ['image_file', 'alt_text', 'order']
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
        
        # Add help text for order field
        self.fields['order'].help_text = "Order 0 = Primary image. Higher numbers appear after."
    
    def clean(self):
        cleaned_data = super().clean()
        image_file = cleaned_data.get('image_file')
        
        # For new instances, require an image file
        if not self.instance.pk and not image_file:
            raise forms.ValidationError("An image file is required for new product images.")
        
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
        elif not instance.filename and not instance.image_data:
            # If no filename exists and no image data, this should be caught by clean()
            pass
        
        if commit:
            instance.save()
        return instance

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    form = ProductImageAdminForm
    extra = 1
    fields = ['image_file', 'alt_text', 'order', 'image_preview', 'is_primary_display']
    readonly_fields = ['image_preview', 'is_primary_display']
    
    def image_preview(self, obj):
        if obj and obj.image_data:
            return mark_safe(f'<img src="{obj.data_url}" style="max-height: 100px; max-width: 100px;" />')
        return "No image"
    image_preview.short_description = "Preview"
    
    def is_primary_display(self, obj):
        return "Yes" if obj and obj.is_primary else "No"
    is_primary_display.short_description = "Primary"

class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'in_stock', 'created_at']
    list_filter = ['category', 'in_stock', 'created_at']
    search_fields = ['name', 'description', 'tags']
    inlines = [ProductImageInline, ProductSpecificationInline]
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    form = ProductImageAdminForm
    list_display = ['product', 'get_filename', 'alt_text', 'is_primary_display', 'order', 'created_at']
    list_filter = ['created_at']
    fields = ['product', 'image_file', 'alt_text', 'order', 'image_preview']
    readonly_fields = ['image_preview']
    ordering = ['product', 'order']
    
    def get_filename(self, obj):
        return obj.filename or "No filename"
    get_filename.short_description = "Filename"
    
    def is_primary_display(self, obj):
        return "Yes" if obj and obj.is_primary else "No"
    is_primary_display.short_description = "Primary"
    is_primary_display.boolean = True
    
    def image_preview(self, obj):
        if obj and obj.image_data:
            return mark_safe(f'<img src="{obj.data_url}" style="max-height: 200px; max-width: 200px;" />')
        return "No image"
    image_preview.short_description = "Current Image"

@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = ['product', 'key', 'value', 'order']
    list_filter = ['key']
