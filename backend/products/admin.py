from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from django.utils.html import format_html
from django.urls import reverse
from .models import Category, Product, ProductImage, ProductSpecification, ProductAttachment

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

class ProductAttachmentAdminForm(forms.ModelForm):
    file_upload = forms.FileField(required=False, help_text="Upload a file (PDF, DOC, XLS, etc.)")
    
    class Meta:
        model = ProductAttachment
        fields = ['file_upload', 'description', 'order', 'is_public']
        exclude = ['file_data', 'filename', 'content_type', 'file_size']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and self.instance.file_data:
            self.fields['current_file'] = forms.CharField(
                required=False,
                widget=forms.HiddenInput(),
                initial="has_file"
            )
    
    def clean(self):
        cleaned_data = super().clean()
        file_upload = cleaned_data.get('file_upload')
        
        # For new instances, require a file
        if not self.instance.pk and not file_upload:
            raise forms.ValidationError("A file is required for new attachments.")
        
        # For existing instances without file_data, require a file
        if self.instance.pk and not self.instance.file_data and not file_upload:
            raise forms.ValidationError("A file is required.")
            
        return cleaned_data
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Handle file upload
        file_upload = self.cleaned_data.get('file_upload')
        if file_upload:
            # Read the uploaded file and store as binary data
            instance.file_data = file_upload.read()
            instance.filename = file_upload.name
            instance.content_type = file_upload.content_type or 'application/octet-stream'
            instance.file_size = len(instance.file_data)
        
        if commit:
            instance.save()
        return instance

class ProductAttachmentInline(admin.TabularInline):
    model = ProductAttachment
    form = ProductAttachmentAdminForm
    extra = 1
    fields = ['file_upload', 'description', 'order', 'is_public', 'file_preview']
    readonly_fields = ['file_preview']
    
    def file_preview(self, obj):
        if obj and obj.file_data:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">{} ({}) - {}</span>',
                obj.filename or 'File',
                obj.content_type or 'Unknown',
                obj.file_size_human
            )
        return "No file"
    file_preview.short_description = "File Info"


class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'

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
        in_stock = products.filter(quantity__gt=0).count()
        out_of_stock = products.filter(quantity=0).count()
        
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
    form = ProductAdminForm
    list_display = ['product_info', 'category_badge', 'order_display', 'price_display', 'quantity_display', 'active_status', 'stock_status', 'image_count', 'attachments_count', 'created_date']
    list_filter = ['category', 'active', 'created_at']
    search_fields = ['name', 'description', 'tags']
    inlines = [ProductImageInline, ProductSpecificationInline, ProductAttachmentInline]
    readonly_fields = ['created_at', 'updated_at', 'product_summary']
    actions = ['export_to_csv', 'mark_active', 'mark_inactive', 'bulk_import_csv']
    list_per_page = 20
    date_hierarchy = 'created_at'
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'price', 'category', 'active', 'quantity', 'order', 'tags')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category').prefetch_related('images', 'attachments')
    
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
    
    def order_display(self, obj):
        if obj.order is not None:
            return format_html(
                '<span style="background: #8e44ad; color: white; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: bold;">⭐ {}</span>',
                obj.order
            )
        return format_html('<span style="color: #999;">—</span>')
    order_display.short_description = "Order"
    order_display.admin_order_field = 'order'
    
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
        elif obj.quantity == 0:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">❌ Out of Stock</span>'
            )
        elif not obj.active:
            return format_html(
                '<span style="color: #f39c12; font-weight: bold;">⚠️ Inactive</span>'
            )
        else:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">❌ Not Available</span>'
            )
    stock_status.short_description = "Status"
    stock_status.admin_order_field = 'quantity'
    
    def image_count(self, obj):
        count = obj.images.count()
        if count > 0:
            return format_html(
                '<span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px;">📷 {}</span>',
                count
            )
        return format_html('<span style="color: #999;">No images</span>')
    image_count.short_description = "Images"
    
    def attachments_count(self, obj):
        count = obj.attachments.count()
        if count > 0:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px;">📄 {}</span>',
                count
            )
        return format_html('<span style="color: #999;">No files</span>')
    attachments_count.short_description = "Files"
    
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
        
        order_display = f'⭐ Featured (Order: {obj.order})' if obj.order is not None else 'Not featured'
        order_color = '#8e44ad' if obj.order is not None else '#999'
        
        summary = f'''
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; color: #333;">
            <h4 style="margin-top: 0; color: #2c3e50;">📋 Product Summary</h4>
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <p style="color: #333;"><strong style="color: #333;">Price:</strong> <span style="color: #27ae60; font-weight: bold;">${obj.price:.2f}</span></p>
                    <p style="color: #333;"><strong style="color: #333;">Active:</strong> {'✅ Yes' if obj.active else '❌ Disabled'}</p>
                    <p style="color: #333;"><strong style="color: #333;">Quantity:</strong> <span style="color: {quantity_color}; font-weight: bold;">{obj.quantity}</span></p>
                    <p style="color: #333;"><strong style="color: #333;">Featured:</strong> <span style="color: {order_color}; font-weight: bold;">{order_display}</span></p>
                    <p style="color: #333;"><strong style="color: #333;">Stock Status:</strong> {'✅ Available' if obj.is_available else '❌ Not Available'}</p>
                    <p style="color: #333;"><strong style="color: #333;">Images:</strong> {images_count}</p>
                    <p style="color: #333;"><strong style="color: #333;">Specifications:</strong> {specs_count}</p>
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
Optional columns: active, quantity, tags

Example:
name,description,price,category,active,quantity,tags
Industrial Pump,High-efficiency pump,2499.99,Pumps,true,50,"industrial,pump"

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
        writer.writerow(['name', 'description', 'price', 'category', 'active', 'quantity', 'tags'])
        
        # Write data
        for product in queryset:
            writer.writerow([
                product.name,
                product.description,
                str(product.price),
                product.category.name if product.category else '',
                product.active,
                product.quantity,
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

@admin.register(ProductAttachment)
class ProductAttachmentAdmin(admin.ModelAdmin):
    form = ProductAttachmentAdminForm
    list_display = ['product', 'get_filename', 'content_type', 'file_size_human', 'is_public', 'order', 'created_at']
    list_filter = ['content_type', 'is_public', 'created_at']
    search_fields = ['filename', 'description', 'product__name']
    fields = ['product', 'file_upload', 'description', 'order', 'is_public', 'file_info']
    readonly_fields = ['file_info']
    ordering = ['product', 'order']
    
    def get_filename(self, obj):
        return obj.filename or "No filename"
    get_filename.short_description = "Filename"
    
    def file_info(self, obj):
        if not obj.file_data:
            return "No file uploaded"
        
        return format_html(
            '''
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                <p><strong>Filename:</strong> {}</p>
                <p><strong>Type:</strong> {}</p>
                <p><strong>Size:</strong> {}</p>
                <p><strong>Is Image:</strong> {}</p>
                <p><strong>Is PDF:</strong> {}</p>
                <p><strong>Is Document:</strong> {}</p>
            </div>
            ''',
            obj.filename or "Unknown",
            obj.content_type or "Unknown",
            obj.file_size_human,
            "✅ Yes" if obj.is_image else "❌ No",
            "✅ Yes" if obj.is_pdf else "❌ No",
            "✅ Yes" if obj.is_document else "❌ No"
        )
    file_info.short_description = "File Details"




