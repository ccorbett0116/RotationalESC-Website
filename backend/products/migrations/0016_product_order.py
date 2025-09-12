# Generated manually for order field addition

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0015_remove_gallery_is_featured_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='order',
            field=models.PositiveIntegerField(blank=True, help_text='Display order for featured products (lower numbers first, null values last)', null=True, unique=True),
        ),
    ]