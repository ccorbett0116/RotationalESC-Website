# Generated migration for populating equipment categories

from django.db import migrations

def populate_equipment_categories(apps, schema_editor):
    EquipmentCategory = apps.get_model('products', 'EquipmentCategory')
    
    # Create the equipment categories based on existing data
    categories_data = [
        {
            'name': 'Pumps',
            'slug': 'pumps',
            'description': 'Explore our selection of industrial pumps from leading manufacturers. We offer a wide range of pump types including centrifugal, diaphragm, positive displacement, and more.',
            'order': 1,
        },
        {
            'name': 'Mechanical Seals',
            'slug': 'mechanical-seals',
            'description': 'Find high-quality mechanical seals from trusted manufacturers. Our extensive selection includes seals for various applications and industries.',
            'order': 2,
        },
        {
            'name': 'Packing',
            'slug': 'packing',
            'description': 'Discover our comprehensive range of industrial packing solutions from leading manufacturers. We offer various types of packing materials for sealing applications.',
            'order': 3,
        },
    ]
    
    # Create equipment categories
    for cat_data in categories_data:
        EquipmentCategory.objects.create(**cat_data)

def reverse_populate_equipment_categories(apps, schema_editor):
    EquipmentCategory = apps.get_model('products', 'EquipmentCategory')
    
    # Delete equipment categories
    EquipmentCategory.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_add_equipment_category'),
    ]

    operations = [
        migrations.RunPython(
            populate_equipment_categories,
            reverse_populate_equipment_categories
        ),
    ]