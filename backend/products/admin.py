from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from .models import Category, Product, ProductImage, ProductSpecification, Section, Manufacturer

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
        return obj.is_primary if obj else False
    is_primary_display.short_description = "Primary"
    is_primary_display.boolean = True

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
    actions = ['export_to_csv']

    def export_to_csv(self, request, queryset):
        """Export selected products to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products_export.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(['name', 'description', 'price', 'category', 'in_stock', 'tags'])
        
        # Write data
        for product in queryset:
            writer.writerow([
                product.name,
                product.description,
                str(product.price),
                product.category.name,
                product.in_stock,
                product.tags
            ])
        
        return response

    export_to_csv.short_description = "Export selected products to CSV"

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
        return obj.is_primary if obj else False
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
    actions = ['export_to_csv']

    def export_to_csv(self, request, queryset):
        """Export selected specifications to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="specifications_export.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(['product_name', 'key', 'value', 'order'])
        
        # Write data
        for spec in queryset:
            writer.writerow([
                spec.product.name,
                spec.key,
                spec.value,
                spec.order
            ])
        
        return response

    export_to_csv.short_description = "Export selected specifications to CSV"


class ManufacturerAdminForm(forms.ModelForm):
    image_file = forms.ImageField(required=False, help_text="Upload manufacturer logo")
    
    class Meta:
        model = Manufacturer
        fields = ['label', 'url', 'image_file', 'sections']
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
            # Save many-to-many relationships
            self.save_m2m()
        return instance


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['label', 'created_at', 'updated_at']
    search_fields = ['label']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    form = ManufacturerAdminForm
    list_display = ['label', 'url', 'get_sections', 'created_at']
    list_filter = ['sections', 'created_at']
    search_fields = ['label']
    filter_horizontal = ['sections']
    fields = ['label', 'url', 'image_file', 'sections', 'image_preview']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    
    def get_sections(self, obj):
        return ", ".join([section.label for section in obj.sections.all()])
    get_sections.short_description = "Sections"
    
    def image_preview(self, obj):
        if obj and obj.image_data:
            return mark_safe(f'<img src="{obj.data_url}" style="max-height: 150px; max-width: 150px; border: 1px solid #ddd;" />')
        return "No image"
    image_preview.short_description = "Logo Preview"
