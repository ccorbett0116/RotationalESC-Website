# Migration to move existing gallery data from products app

from django.db import migrations

def migrate_gallery_data(apps, schema_editor):
    # Get the models
    GalleryCategory = apps.get_model('galleries', 'GalleryCategory')
    GalleryImage = apps.get_model('galleries', 'GalleryImage')
    
    # Get the old models from products app
    OldGallery = apps.get_model('products', 'Gallery')
    OldNewGallery = apps.get_model('products', 'NewGallery')
    
    # Create gallery categories
    service_category, created = GalleryCategory.objects.get_or_create(
        slug='service-repair',
        defaults={
            'name': 'Service & Repair',
            'description': 'Explore our comprehensive service and repair capabilities. We provide expert maintenance, refurbishment, and repair services for all types of rotational equipment.',
            'order': 1,
            'active': True,
            'meta_title': 'Service & Repair Gallery | Rotational Equipment Services',
            'meta_description': 'View our service and repair work gallery showcasing expert maintenance and refurbishment of rotational equipment.',
        }
    )
    print(f'Service & Repair category created: {created}')
    
    new_equipment_category, created = GalleryCategory.objects.get_or_create(
        slug='new-equipment',
        defaults={
            'name': 'New Equipment',
            'description': 'Discover our selection of new rotational equipment from leading manufacturers. Browse our gallery of new pumps, seals, and other equipment.',
            'order': 2,
            'active': True,
            'meta_title': 'New Equipment Gallery | Rotational Equipment Services',
            'meta_description': 'Browse our new equipment gallery featuring the latest rotational equipment from trusted manufacturers.',
        }
    )
    print(f'New Equipment category created: {created}')
    
    # Migrate existing Gallery (Service & Repair) images
    service_images_migrated = 0
    service_order = 0
    for old_image in OldGallery.objects.all().order_by('order', 'created_at'):
        new_image = GalleryImage.objects.create(
            category=service_category,
            title=old_image.title,
            description=old_image.description,
            image_data=old_image.image_data,
            filename=old_image.filename,
            content_type=old_image.content_type,
            alt_text=old_image.alt_text,
            order=service_order,  # Use incremental order to avoid duplicates
            created_at=old_image.created_at,
            updated_at=old_image.updated_at,
        )
        service_images_migrated += 1
        service_order += 1
    
    print(f'Migrated {service_images_migrated} service & repair images')
    
    # Migrate existing NewGallery (New Equipment) images
    new_equipment_images_migrated = 0
    new_equipment_order = 0
    for old_image in OldNewGallery.objects.all().order_by('order', 'created_at'):
        new_image = GalleryImage.objects.create(
            category=new_equipment_category,
            title=old_image.title,
            description=old_image.description,
            image_data=old_image.image_data,
            filename=old_image.filename,
            content_type=old_image.content_type,
            alt_text=old_image.alt_text,
            order=new_equipment_order,  # Use incremental order to avoid duplicates
            created_at=old_image.created_at,
            updated_at=old_image.updated_at,
        )
        new_equipment_images_migrated += 1
        new_equipment_order += 1
    
    print(f'Migrated {new_equipment_images_migrated} new equipment images')

def reverse_migrate_gallery_data(apps, schema_editor):
    # Delete all gallery data
    GalleryCategory = apps.get_model('galleries', 'GalleryCategory')
    GalleryImage = apps.get_model('galleries', 'GalleryImage')
    
    GalleryImage.objects.all().delete()
    GalleryCategory.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('galleries', '0001_initial'),
        ('products', '0005_add_unique_order_constraint'),  # Make sure this runs after products migrations
    ]

    operations = [
        migrations.RunPython(
            migrate_gallery_data,
            reverse_migrate_gallery_data
        ),
    ]