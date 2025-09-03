from django.core.management.base import BaseCommand
from products.models import Category, Product, ProductSpecification

class Command(BaseCommand):
    help = 'Populate database with sample products'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample categories and products...')
        
        # Create categories
        categories = [
            {'name': 'Pumps', 'description': 'Industrial pumps for various applications'},
            {'name': 'Compressors', 'description': 'Air and gas compressors'},
            {'name': 'Motors', 'description': 'Electric motors and drives'},
            {'name': 'Bearings', 'description': 'Ball and roller bearings'},
            {'name': 'Seals', 'description': 'Mechanical seals and gaskets'},
        ]
        
        created_categories = {}
        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            created_categories[cat_data['name']] = category
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Create products
        products_data = [
            {
                'name': 'Industrial Centrifugal Pump',
                'description': 'High-efficiency centrifugal pump designed for industrial applications. Features corrosion-resistant materials and optimized impeller design.',
                'price': 2499.99,
                'category': 'Pumps',
                'material': 'Stainless Steel',
                'tags': 'centrifugal, industrial, stainless steel, high-efficiency, corrosion-resistant',
                'specifications': {
                    'Flow Rate': '500 GPM',
                    'Head': '150 ft',
                    'Power': '25 HP',
                    'Inlet Size': '6 inches',
                    'Outlet Size': '4 inches'
                }
            },
            {
                'name': 'Positive Displacement Pump',
                'description': 'Reliable positive displacement pump for viscous fluids and precise flow control applications.',
                'price': 3299.99,
                'category': 'Pumps',
                'material': 'Cast Iron',
                'tags': 'positive displacement, viscous fluids, flow control, precision, cast iron',
                'specifications': {
                    'Flow Rate': '200 GPM',
                    'Pressure': '300 PSI',
                    'Power': '15 HP',
                    'Inlet Size': '4 inches',
                    'Outlet Size': '3 inches'
                }
            },
            {
                'name': 'Rotary Screw Compressor',
                'description': 'Energy-efficient rotary screw compressor with advanced control systems and low maintenance requirements.',
                'price': 15999.99,
                'category': 'Compressors',
                'material': 'Steel',
                'tags': 'rotary screw, compressor, energy-efficient, low maintenance, air cooled',
                'specifications': {
                    'Air Flow': '125 CFM',
                    'Pressure': '175 PSI',
                    'Power': '30 HP',
                    'Tank Size': '120 gallons',
                    'Cooling': 'Air Cooled',
                    'Control': 'VFD'
                }
            },
            {
                'name': 'Mechanical Seal Assembly',
                'description': 'Durable mechanical seal assembly designed for high-pressure and high-temperature pump applications.',
                'price': 4999.99,
                'category': 'Seals',
                'material': 'Carbon/SiC/SS316',
                'tags': 'mechanical seal, pumps, leak prevention, API 682, industrial',
                'specifications': {
                    'Type': 'Cartridge Seal',
                    'Pressure Rating': '600 PSI',
                    'Temperature Rating': '400°F',
                    'Shaft Size': '2 inches',
                    'Design': 'Balanced',
                    'API Standard': 'API 682'
                }
            },
            {
                'name': 'Variable Frequency Drive Motor',
                'description': 'Premium efficiency motor with integrated variable frequency drive for optimal energy consumption.',
                'price': 1899.99,
                'category': 'Motors',
                'material': 'Cast Aluminum',
                'tags': 'motor, VFD, energy saving, high efficiency, industrial',
                'specifications': {
                    'Power': '50 HP',
                    'Voltage': '480V',
                    'Speed': '1750 RPM',
                    'Efficiency': '96.2%',
                    'Frame': '326T',
                    'Enclosure': 'TEFC'
                }
            },
            {
                'name': 'Heavy Duty Ball Bearing',
                'description': 'High-capacity ball bearing designed for heavy industrial applications with extended service life.',
                'price': 299.99,
                'category': 'Bearings',
                'material': 'Chrome Steel',
                'tags': 'ball bearing, heavy duty, industrial, long life, high load',
                'specifications': {
                    'Bore': '100mm',
                    'Outside Diameter': '180mm',
                    'Width': '34mm',
                    'Load Rating': '95 kN',
                    'Speed Limit': '4300 RPM',
                    'Sealing': 'Double Sealed'
                }
            }
        ]
        
        for product_data in products_data:
            category = created_categories[product_data['category']]
            specifications = product_data.pop('specifications')
            
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults={
                    **product_data,
                    'category': category
                }
            )
            
            if created:
                self.stdout.write(f'Created product: {product.name}')
                
                # Add specifications
                for order, (key, value) in enumerate(specifications.items()):
                    ProductSpecification.objects.create(
                        product=product,
                        key=key,
                        value=value,
                        order=order
                    )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated database with sample data!')
        )
