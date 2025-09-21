from django.db import models
import base64
from PIL import Image
import io


class EquipmentCategory(models.Model):
    """
    Equipment categories for dynamic page generation (e.g., Pumps, Mechanical Seals, Packing, Generators)
    """
    name = models.CharField(max_length=100, unique=True, help_text="Display name (e.g., 'Pumps', 'Mechanical Seals')")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL slug (e.g., 'pumps', 'mechanical-seals')")
    description = models.TextField(help_text="Page description text")
    meta_title = models.CharField(max_length=200, blank=True, help_text="SEO meta title (optional)")
    meta_description = models.CharField(max_length=300, blank=True, help_text="SEO meta description (optional)")
    active = models.BooleanField(default=True, help_text="Whether this category is active and accessible")
    order = models.PositiveIntegerField(unique=True, help_text="Display order in navigation (must be unique)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Equipment Categories"

    def __str__(self):
        return self.name


class Section(models.Model):
    """
    Sections for organizing manufacturers (e.g., Centrifugal, Diaphragm, PD for pumps)
    """
    label = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=800, blank=True, null=True, help_text="Optional description for the section")
    equipment_category = models.ForeignKey(EquipmentCategory, on_delete=models.CASCADE, related_name='sections', help_text="Which equipment category this section belongs to", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['equipment_category__order', 'label']

    def __str__(self):
        return f"{self.label} ({self.equipment_category.name})"


class Manufacturer(models.Model):
    """
    Manufacturers with logos, URLs, and section tags
    """
    label = models.CharField(max_length=100)
    url = models.URLField(help_text="Manufacturer's website URL", blank=True, null=True)
    image_data = models.BinaryField(help_text="Manufacturer logo image")
    order = models.PositiveIntegerField(default=0)
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
        if self.image_data and isinstance(self.image_data, bytes):
            try:
                image = Image.open(io.BytesIO(self.image_data))

                if image.mode in ('RGBA', 'P'):
                    image = image.convert('RGB')

                # Resize longest side to 300px, keep aspect ratio
                image.thumbnail((300, 300), Image.Resampling.LANCZOS)

                output = io.BytesIO()
                image.save(output, format='JPEG', quality=90)
                self.image_data = output.getvalue()
                self.content_type = 'image/jpeg'

            except Exception:
                pass

        super().save(*args, **kwargs)