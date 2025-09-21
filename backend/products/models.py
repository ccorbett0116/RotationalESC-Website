from django.db import models
from django.core.exceptions import ValidationError
import base64
import uuid
from PIL import Image
import io

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    active = models.BooleanField(default=True, help_text="Whether this product is available for sale")
    quantity = models.PositiveIntegerField(default=0, help_text="Available quantity in stock")
    order = models.PositiveIntegerField(null=True, blank=True, unique=True, help_text="Display order for featured products (lower numbers first, null values last)")
    tags = models.CharField(max_length=500, blank=True, null=True, help_text="Comma-separated tags")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    
    @property
    def is_available(self):
        """Returns True if product is active and has available quantity"""
        return self.active and self.quantity > 0
    
    @property
    def in_stock(self):
        """Returns True if quantity > 0 (for backward compatibility)"""
        return self.quantity > 0
    
    def reduce_quantity(self, amount):
        """Reduce product quantity by specified amount"""
        if self.quantity >= amount:
            self.quantity -= amount
            self.save()
            return True
        return False

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_data = models.BinaryField()
    filename = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.CharField(max_length=100, default='image/jpeg')
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'order'],
                name='unique_product_image_order'
            ),
        ]

    def clean(self):
        """Custom validation for ProductImage"""
        super().clean()
        
        # Check for duplicate order=0 (primary) images within the same product
        # Only perform this check if the product is already saved
        if self.order == 0 and self.product and self.product.pk:
            existing_primary = ProductImage.objects.filter(
                product=self.product,
                order=0
            ).exclude(pk=self.pk)
            
            if existing_primary.exists():
                raise ValidationError({
                    'order': 'Only one image can have order 0 (primary) per product.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to call clean validation"""
        # Only call full_clean if the product is saved (to avoid related filter issues)
        if self.product and self.product.pk:
            self.full_clean()
        super().save(*args, **kwargs)
        
        # After saving, perform the primary image validation if needed
        if self.order == 0 and self.product and self.product.pk:
            other_primary = ProductImage.objects.filter(
                product=self.product,
                order=0
            ).exclude(pk=self.pk)
            
            if other_primary.exists():
                # Update other primary images to order=1
                other_primary.update(order=1)

    def __str__(self):
        filename = self.filename or "No filename"
        return f"{self.product.name} - {filename}"
    
    @property
    def is_primary(self):
        """Returns True if this is the primary image (order=0)"""
        return self.order == 0
    
    @property
    def image_base64(self):
        """Return base64 encoded image data"""
        if self.image_data:
            return base64.b64encode(self.image_data).decode('utf-8')
        return None
    
    @property
    def data_url(self):
        """Return data URL for the image"""
        if self.image_data:
            base64_data = self.image_base64
            return f"data:{self.content_type};base64,{base64_data}"
        return None

class ProductAttachment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attachments')
    file_data = models.BinaryField()
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    description = models.CharField(max_length=500, blank=True, help_text="Optional description of the file")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    is_public = models.BooleanField(default=True, help_text="Whether this file is publicly accessible")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'order'],
                name='unique_product_attachment_order'
            ),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.filename}"
    
    @property
    def file_base64(self):
        """Return base64 encoded file data"""
        if self.file_data:
            return base64.b64encode(self.file_data).decode('utf-8')
        return None
    
    @property
    def data_url(self):
        """Return data URL for the file"""
        if self.file_data:
            base64_data = self.file_base64
            return f"data:{self.content_type};base64,{base64_data}"
        return None
    
    @property
    def file_size_human(self):
        """Return human-readable file size"""
        if self.file_size:
            for unit in ['B', 'KB', 'MB', 'GB']:
                if self.file_size < 1024.0:
                    return f"{self.file_size:.1f} {unit}"
                self.file_size /= 1024.0
            return f"{self.file_size:.1f} TB"
        return "0 B"
    
    @property
    def is_image(self):
        """Check if the file is an image"""
        return self.content_type.startswith('image/') if self.content_type else False
    
    @property
    def is_pdf(self):
        """Check if the file is a PDF"""
        return self.content_type == 'application/pdf' if self.content_type else False
    
    @property
    def is_document(self):
        """Check if the file is a document (Word, Excel, PowerPoint, etc.)"""
        document_types = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ]
        return self.content_type in document_types if self.content_type else False

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'key']
        unique_together = ['product', 'key']

    def __str__(self):
        return f"{self.product.name} - {self.key}: {self.value}"



