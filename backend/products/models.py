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
    PAGE_CHOICES = [
        ('seals', 'Seals'),
        ('packing', 'Packing'),
        ('pumps', 'Pumps'),
        ('general', 'General Shop'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    page = models.CharField(max_length=20, choices=PAGE_CHOICES, default='general', help_text="Which page should this product appear on")
    in_stock = models.BooleanField(default=True)
    tags = models.CharField(max_length=500, help_text="Comma-separated tags")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []

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


class Section(models.Model):
    """
    Sections for organizing manufacturers (e.g., Centrifugal, Diaphragm, PD for pumps)
    """
    label = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        return self.label


class Manufacturer(models.Model):
    """
    Manufacturers with logos, URLs, and section tags
    """
    label = models.CharField(max_length=100)
    url = models.URLField(help_text="Manufacturer's website URL")
    image_data = models.BinaryField(help_text="Manufacturer logo image")
    filename = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.CharField(max_length=100, default='image/jpeg')
    sections = models.ManyToManyField(Section, related_name='manufacturers', help_text="Sections this manufacturer belongs to")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        return self.label

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

    def save(self, *args, **kwargs):
        """Process and resize image to square format if image_data is present"""
        if self.image_data and isinstance(self.image_data, bytes):
            try:
                # Open the image
                image = Image.open(io.BytesIO(self.image_data))
                
                # Convert to RGB if necessary
                if image.mode in ('RGBA', 'P'):
                    image = image.convert('RGB')
                
                # Resize to square (300x300) maintaining aspect ratio
                size = (300, 300)
                
                # Create a square image with white background
                square_image = Image.new('RGB', size, (255, 255, 255))
                
                # Calculate position to center the original image
                image.thumbnail(size, Image.Resampling.LANCZOS)
                x = (size[0] - image.width) // 2
                y = (size[1] - image.height) // 2
                
                # Paste the resized image onto the square background
                square_image.paste(image, (x, y))
                
                # Save the processed image back to bytes
                output = io.BytesIO()
                square_image.save(output, format='JPEG', quality=90)
                self.image_data = output.getvalue()
                self.content_type = 'image/jpeg'
                
            except Exception as e:
                # If image processing fails, keep original data
                pass
        
        super().save(*args, **kwargs)
