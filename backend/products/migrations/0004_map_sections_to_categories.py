# Migration to map existing sections to equipment categories

from django.db import migrations

def map_sections_to_categories(apps, schema_editor):
    EquipmentCategory = apps.get_model('products', 'EquipmentCategory')
    Section = apps.get_model('products', 'Section')
    
    # Get the created categories
    pumps_category = EquipmentCategory.objects.filter(slug='pumps').first()
    seals_category = EquipmentCategory.objects.filter(slug='mechanical-seals').first()
    packing_category = EquipmentCategory.objects.filter(slug='packing').first()
    
    # Map sections based on their names/content since we can't use the page field anymore
    # You may need to adjust these mappings based on your actual section data
    
    if pumps_category:
        # Map pump-related sections - adjust these as needed based on actual data
        pump_sections = Section.objects.filter(
            equipment_category__isnull=True
        ).filter(
            label__icontains='pump'  # Adjust this filter based on your section names
        )
        pump_sections.update(equipment_category=pumps_category)
        
        # Also map any sections with pump-related descriptions
        pump_sections_desc = Section.objects.filter(
            equipment_category__isnull=True,
            description__icontains='pump'
        )
        pump_sections_desc.update(equipment_category=pumps_category)
    
    if seals_category:
        # Map seal-related sections
        seal_sections = Section.objects.filter(
            equipment_category__isnull=True
        ).filter(
            label__icontains='seal'
        )
        seal_sections.update(equipment_category=seals_category)
        
        seal_sections_desc = Section.objects.filter(
            equipment_category__isnull=True,
            description__icontains='seal'
        )
        seal_sections_desc.update(equipment_category=seals_category)
    
    if packing_category:
        # Map packing-related sections
        packing_sections = Section.objects.filter(
            equipment_category__isnull=True
        ).filter(
            label__icontains='pack'
        )
        packing_sections.update(equipment_category=packing_category)
        
        packing_sections_desc = Section.objects.filter(
            equipment_category__isnull=True,
            description__icontains='pack'
        )
        packing_sections_desc.update(equipment_category=packing_category)
    
    # For any remaining unmapped sections, assign them to pumps as default
    if pumps_category:
        Section.objects.filter(equipment_category__isnull=True).update(equipment_category=pumps_category)

def reverse_map_sections_to_categories(apps, schema_editor):
    Section = apps.get_model('products', 'Section')
    
    # Clear all equipment_category assignments
    Section.objects.all().update(equipment_category=None)

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_populate_equipment_categories'),
    ]

    operations = [
        migrations.RunPython(
            map_sections_to_categories,
            reverse_map_sections_to_categories
        ),
    ]