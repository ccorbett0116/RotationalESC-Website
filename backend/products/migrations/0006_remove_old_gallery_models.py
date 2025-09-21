# Migration to remove old gallery models after migrating to galleries app

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_add_unique_order_constraint'),
        ('galleries', '0002_migrate_existing_galleries'),  # Ensure gallery migration completed first
    ]

    operations = [
        migrations.DeleteModel(
            name='Gallery',
        ),
        migrations.DeleteModel(
            name='NewGallery',
        ),
    ]