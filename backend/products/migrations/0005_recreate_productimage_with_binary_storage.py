# Generated manually on 2025-09-03
# Migration to convert ProductImage from file storage to binary storage

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_remove_material_field'),
    ]

    operations = [
        # Delete all existing ProductImage records and drop the table
        migrations.RunSQL(
            "DELETE FROM products_productimage;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Drop the existing ProductImage table
        migrations.DeleteModel(
            name='ProductImage',
        ),
        
        # Recreate ProductImage with binary storage
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_data', models.BinaryField()),
                ('filename', models.CharField(max_length=255)),
                ('content_type', models.CharField(default='image/jpeg', max_length=100)),
                ('alt_text', models.CharField(blank=True, max_length=200)),
                ('is_primary', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='products.product')),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),
    ]
