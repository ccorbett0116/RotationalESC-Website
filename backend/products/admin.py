from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from django.utils.html import format_html
from django.urls import reverse
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
    list_display = ['name_with_icon', 'product_count', 'description_excerpt', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['product_count_detail', 'created_at']
    
    def name_with_icon(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2c3e50;">🏷️ {}</span>',
            obj.name
        )
    name_with_icon.short_description = "Category"
    name_with_icon.admin_order_field = 'name'
    
    def product_count(self, obj):
        count = obj.products.count()
        return format_html(
            '<span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">{} products</span>',
            count
        )
    product_count.short_description = "Products"
    
    def description_excerpt(self, obj):
        if obj.description and len(obj.description) > 50:
            return obj.description[:50] + "..."
        return obj.description or "—"
    description_excerpt.short_description = "Description"
    
    def product_count_detail(self, obj):
        if not obj.pk:
            return "Save to see product count"
        
        products = obj.products.all()
        in_stock = products.filter(in_stock=True).count()
        out_of_stock = products.filter(in_stock=False).count()
        
        return format_html(
            '''
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                <p><strong>Total Products:</strong> {}</p>
                <p><span style="color: #27ae60;">✅ In Stock:</span> {}</p>
                <p><span style="color: #e74c3c;">❌ Out of Stock:</span> {}</p>
            </div>
            ''',
            products.count(), in_stock, out_of_stock
        )
    product_count_detail.short_description = "Product Statistics"

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_info', 'category_badge', 'price_display', 'quantity_display', 'active_status', 'stock_status', 'image_count', 'created_date']
    list_filter = ['category', 'active', 'in_stock', 'created_at']
    search_fields = ['name', 'description', 'tags']
    inlines = [ProductImageInline, ProductSpecificationInline]
    readonly_fields = ['created_at', 'updated_at', 'product_summary']
    actions = ['export_to_csv', 'mark_in_stock', 'mark_out_of_stock', 'mark_active', 'mark_inactive', 'bulk_import_csv']
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category').prefetch_related('images')
    
    def product_info(self, obj):
        return format_html(
            '<div><strong style="color: #2c3e50;">{}</strong><br><small style="color: #666;">{}</small></div>',
            obj.name,
            obj.description[:60] + "..." if len(obj.description or "") > 60 else obj.description or "No description"
        )
    product_info.short_description = "Product"
    product_info.admin_order_field = 'name'
    
    def category_badge(self, obj):
        if obj.category:
            return format_html(
                '<span style="background: #17a2b8; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
                obj.category.name
            )
        return format_html('<span style="color: #999;">No category</span>')
    category_badge.short_description = "Category"
    category_badge.admin_order_field = 'category__name'
    
    def price_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #27ae60; font-size: 14px;">${}</span>',
            f"{obj.price:.2f}"
        )
    price_display.short_description = "Price"
    price_display.admin_order_field = 'price'
    
    def quantity_display(self, obj):
        if obj.quantity == 0:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold; background: #ffe6e6; padding: 2px 6px; border-radius: 4px;">0</span>'
            )
        elif obj.quantity <= 5:
            return format_html(
                '<span style="color: #f39c12; font-weight: bold; background: #fff3cd; padding: 2px 6px; border-radius: 4px;">{}</span>',
                obj.quantity
            )
        else:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold; background: #e6ffe6; padding: 2px 6px; border-radius: 4px;">{}</span>',
                obj.quantity
            )
    quantity_display.short_description = "Quantity"
    quantity_display.admin_order_field = 'quantity'
    
    def active_status(self, obj):
        if obj.active:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">✅ Active</span>'
            )
        else:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">❌ Disabled</span>'
            )
    active_status.short_description = "Active"
    active_status.admin_order_field = 'active'
    
    def stock_status(self, obj):
        if obj.is_available:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">✅ Available</span>'
            )
        elif obj.in_stock and obj.quantity == 0:
            return format_html(
                '<span style="color: #f39c12; font-weight: bold;">⚠️ Empty Stock</span>'
            )
        else:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">❌ Out of Stock</span>'
            )
    stock_status.short_description = "Status"
    stock_status.admin_order_field = 'in_stock'
    
    def image_count(self, obj):
        count = obj.images.count()
        if count > 0:
            return format_html(
                '<span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px;">📷 {}</span>',
                count
            )
        return format_html('<span style="color: #999;">No images</span>')
    image_count.short_description = "Images"
    
    def created_date(self, obj):
        return format_html(
            '<span style="color: #666;">{}</span>',
            obj.created_at.strftime('%Y-%m-%d')
        )
    created_date.short_description = "Created"
    created_date.admin_order_field = 'created_at'
    
    def product_summary(self, obj):
        if not obj.pk:
            return "Save the product to see summary"
            
        specs_count = obj.specifications.count()
        images_count = obj.images.count()
        primary_image = obj.images.filter(order=0).first()
        
        quantity_color = '#e74c3c' if obj.quantity == 0 else '#f39c12' if obj.quantity <= 5 else '#27ae60'
        
        summary = f'''
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="margin-top: 0; color: #2c3e50;">📋 Product Summary</h4>
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <p><strong>Price:</strong> <span style="color: #27ae60; font-weight: bold;">${obj.price:.2f}</span></p>
                    <p><strong>Active:</strong> {'✅ Yes' if obj.active else '❌ Disabled'}</p>
                    <p><strong>Quantity:</strong> <span style="color: {quantity_color}; font-weight: bold;">{obj.quantity}</span></p>
                    <p><strong>Stock Status:</strong> {'✅ Available' if obj.is_available else '❌ Not Available'}</p>
                    <p><strong>Images:</strong> {images_count}</p>
                    <p><strong>Specifications:</strong> {specs_count}</p>
                </div>
        '''
        
        if primary_image and primary_image.image_data:
            summary += f'''
                <div style="flex: 0 0 150px;">
                    <img src="{primary_image.data_url}" style="max-width: 150px; max-height: 150px; border-radius: 6px; border: 1px solid #ddd;" />
                </div>
            '''
        
        summary += '</div></div>'
        return mark_safe(summary)
    product_summary.short_description = "Product Summary"
    
    def mark_in_stock(self, request, queryset):
        updated = queryset.update(in_stock=True)
        self.message_user(request, f'{updated} product(s) marked as in stock.')
    mark_in_stock.short_description = "Mark selected products as in stock"
    
    def mark_out_of_stock(self, request, queryset):
        updated = queryset.update(in_stock=False)
        self.message_user(request, f'{updated} product(s) marked as out of stock.')
    mark_out_of_stock.short_description = "Mark selected products as out of stock"
    
    def mark_active(self, request, queryset):
        updated = queryset.update(active=True)
        self.message_user(request, f'{updated} product(s) marked as active.')
    mark_active.short_description = "Mark selected products as active"
    
    def mark_inactive(self, request, queryset):
        updated = queryset.update(active=False)
        self.message_user(request, f'{updated} product(s) marked as inactive.')
    mark_inactive.short_description = "Mark selected products as inactive"
    
    def bulk_import_csv(self, request, queryset):
        """Bulk import products from CSV - shows instructions"""
        from django.http import HttpResponse
        
        help_response = """CSV Import Instructions:

Products CSV Format:
Required columns: name, description, price, category
Optional columns: active, quantity, in_stock, tags

Example:
name,description,price,category,active,quantity,in_stock,tags
Industrial Pump,High-efficiency pump,2499.99,Pumps,true,50,true,"industrial,pump"

Specifications CSV Format (Optional):
Required columns: product_name, key, value
Optional columns: order

Example:
product_name,key,value,order
Industrial Pump,Flow Rate,500 GPM,0

To import: Create a CSV file with the format above, then use Django's management commands or create a custom import script."""
        
        return HttpResponse(help_response, content_type='text/plain')
    

    def export_to_csv(self, request, queryset):
        """Export selected products to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products_export.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(['name', 'description', 'price', 'category', 'active', 'quantity', 'in_stock', 'tags'])
        
        # Write data
        for product in queryset:
            writer.writerow([
                product.name,
                product.description,
                str(product.price),
                product.category.name if product.category else '',
                product.active,
                product.quantity,
                product.in_stock,
                product.tags
            ])
        
        return response

    export_to_csv.short_description = "Export selected products to CSV"
    bulk_import_csv.short_description = "Show CSV import format instructions"

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
    list_display = ['label', 'page', 'created_at', 'updated_at']
    list_filter = ['page', 'created_at']
    search_fields = ['label']
    readonly_fields = ['created_at', 'updated_at']
    fields = ['label', 'page', 'created_at', 'updated_at']


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
