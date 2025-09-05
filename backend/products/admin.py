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
    list_display = ['name', 'category', 'page', 'price', 'in_stock', 'created_at']
    list_filter = ['category', 'page', 'in_stock', 'created_at']
    search_fields = ['name', 'description', 'tags']
    inlines = [ProductImageInline, ProductSpecificationInline]
    readonly_fields = ['created_at', 'updated_at']
    actions = ['export_to_csv']
    
    def changelist_view(self, request, extra_context=None):
        """Add import CSV button to the changelist"""
        extra_context = extra_context or {}
        extra_context['import_csv_url'] = 'import-csv/'
        return super().changelist_view(request, extra_context)
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('import-csv/', self.admin_site.admin_view(self.import_csv), name='products_product_import_csv'),
        ]
        return custom_urls + urls
    
    def import_csv(self, request):
        """Import products from CSV file"""
        from django.shortcuts import render, redirect
        from django.contrib import messages
        from django import forms
        from django.db import transaction
        import csv
        import io
        from decimal import Decimal, InvalidOperation
        
        class CSVImportForm(forms.Form):
            products_csv_file = forms.FileField(
                label='Products CSV File',
                help_text='CSV file with products data. Required columns: name, description, price, category, page'
            )
            specifications_csv_file = forms.FileField(
                label='Specifications CSV File (Optional)',
                required=False,
                help_text='Optional CSV file with product specifications'
            )
            update_existing = forms.BooleanField(
                label='Update existing products',
                required=False,
                help_text='If checked, existing products will be updated. Otherwise, duplicates will be skipped.'
            )
        
        if request.method == 'POST':
            form = CSVImportForm(request.POST, request.FILES)
            if form.is_valid():
                products_file = form.cleaned_data['products_csv_file']
                specs_file = form.cleaned_data.get('specifications_csv_file')
                update_existing = form.cleaned_data['update_existing']
                
                try:
                    with transaction.atomic():
                        # Import products
                        products_imported = self._import_products_from_csv(products_file, update_existing)
                        
                        # Import specifications if provided
                        specs_imported = 0
                        if specs_file:
                            specs_imported = self._import_specifications_from_csv(specs_file)
                        
                        messages.success(
                            request,
                            f'Successfully imported {products_imported} products and {specs_imported} specifications.'
                        )
                        return redirect('..')
                        
                except Exception as e:
                    messages.error(request, f'Import failed: {str(e)}')
        else:
            form = CSVImportForm()
        
        help_text = """
        <h3>CSV Format Requirements</h3>
        <h4>Products CSV:</h4>
        <p><strong>Required columns:</strong> name, description, price, category, page</p>
        <p><strong>Optional columns:</strong> in_stock, tags</p>
        <p><strong>Page values:</strong> seals, packing, pumps, general</p>
        <pre>name,description,price,category,page,in_stock,tags
Industrial Pump,High-efficiency pump,2499.99,Pumps,pumps,true,"industrial,pump"</pre>
        
        <h4>Specifications CSV (Optional):</h4>
        <p><strong>Required columns:</strong> product_name, key, value</p>
        <p><strong>Optional columns:</strong> order</p>
        <pre>product_name,key,value,order
Industrial Pump,Flow Rate,500 GPM,0</pre>
        """
        
        context = {
            'form': form,
            'title': 'Import Products from CSV',
            'help_text': help_text
        }
        return render(request, 'admin/products/import_csv.html', context)
    
    def _import_products_from_csv(self, csv_file, update_existing):
        """Import products from CSV file"""
        from decimal import Decimal, InvalidOperation
        
        imported_count = 0
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        for row in reader:
            try:
                name = row['name'].strip()
                description = row['description'].strip()
                category_name = row['category'].strip()
                page = row['page'].strip()
                
                # Validate page value
                valid_pages = ['seals', 'packing', 'pumps', 'general']
                if page not in valid_pages:
                    raise ValueError(f'Invalid page value "{page}". Must be one of: {", ".join(valid_pages)}')
                
                # Parse price
                try:
                    price_str = row['price'].strip().replace('$', '').replace(',', '')
                    price = Decimal(price_str)
                except (InvalidOperation, ValueError):
                    raise ValueError(f'Invalid price "{row["price"]}" for product "{name}"')
                
                # Get or create category
                category, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'description': f'Category for {category_name}'}
                )
                
                # Optional fields
                in_stock = row.get('in_stock', 'true').strip().lower() in ['true', '1', 'yes', 'y']
                tags = row.get('tags', '').strip()
                
                # Check if product exists
                product_exists = Product.objects.filter(name=name).exists()
                
                if product_exists and not update_existing:
                    continue  # Skip existing products
                
                if product_exists and update_existing:
                    # Update existing product
                    product = Product.objects.get(name=name)
                    product.description = description
                    product.price = price
                    product.category = category
                    product.page = page
                    product.in_stock = in_stock
                    product.tags = tags
                    product.save()
                else:
                    # Create new product
                    Product.objects.create(
                        name=name,
                        description=description,
                        price=price,
                        category=category,
                        page=page,
                        in_stock=in_stock,
                        tags=tags
                    )
                
                imported_count += 1
                
            except Exception as e:
                raise Exception(f'Error processing row: {str(e)}')
        
        return imported_count
    
    def _import_specifications_from_csv(self, csv_file):
        """Import product specifications from CSV file"""
        imported_count = 0
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        for row in reader:
            try:
                product_name = row['product_name'].strip()
                key = row['key'].strip()
                value = row['value'].strip()
                order = int(row.get('order', 0))
                
                try:
                    product = Product.objects.get(name=product_name)
                except Product.DoesNotExist:
                    continue  # Skip if product doesn't exist
                
                # Create or update specification
                ProductSpecification.objects.update_or_create(
                    product=product,
                    key=key,
                    defaults={'value': value, 'order': order}
                )
                
                imported_count += 1
                
            except Exception as e:
                continue  # Skip problematic rows
        
        return imported_count

    def export_to_csv(self, request, queryset):
        """Export selected products to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products_export.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(['name', 'description', 'price', 'category', 'page', 'in_stock', 'tags'])
        
        # Write data
        for product in queryset:
            writer.writerow([
                product.name,
                product.description,
                str(product.price),
                product.category.name,
                product.page,
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
