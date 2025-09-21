from django.db import models
import base64
from PIL import Image
import io


class GalleryCategory(models.Model):
    """
    Gallery categories for dynamic gallery page generation (e.g., Service & Repair, New Equipment, etc.)
    """
    name = models.CharField(max_length=100, unique=True, help_text="Display name (e.g., 'Service & Repair', 'New Equipment')")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL slug (e.g., 'service-repair', 'new-equipment')")
    description = models.TextField(help_text="Page description text")
    meta_title = models.CharField(max_length=200, blank=True, help_text="SEO meta title (optional)")
    meta_description = models.CharField(max_length=300, blank=True, help_text="SEO meta description (optional)")
    active = models.BooleanField(default=True, help_text="Whether this gallery category is active and accessible")
    order = models.PositiveIntegerField(unique=True, help_text="Display order in navigation (must be unique)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Gallery Categories"

    def __str__(self):
        return self.name


class GalleryImage(models.Model):
    """
    Gallery images associated with categories
    """
    category = models.ForeignKey(GalleryCategory, on_delete=models.CASCADE, related_name='images')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image_data = models.BinaryField()
    filename = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.CharField(max_length=100, default='image/jpeg')
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__order', 'order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'order'],
                name='unique_gallery_image_order'
            ),
        ]

    def __str__(self):
        return f"{self.category.name} - {self.title}"

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
        if self.image_data and isinstance(self.image_data, bytes):
            try:
                image = Image.open(io.BytesIO(self.image_data))

                if image.mode in ('RGBA', 'P'):
                    image = image.convert('RGB')

                # Resize to max width/height of 1200px, keep aspect ratio
                image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

                output = io.BytesIO()
                image.save(output, format='JPEG', quality=90)
                self.image_data = output.getvalue()
                self.content_type = 'image/jpeg'

            except Exception:
                pass

        super().save(*args, **kwargs)
