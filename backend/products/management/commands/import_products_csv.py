import csv
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from products.models import Category, Product, ProductSpecification


class Command(BaseCommand):
    help = 'Import products and their specifications from CSV files'

    def add_arguments(self, parser):
        parser.add_argument(
            'products_csv',
            type=str,
            nargs='?',
            help='Path to the products CSV file'
        )
        parser.add_argument(
            '--specs-csv',
            type=str,
            help='Optional path to the specifications CSV file'
        )
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing products if they already exist (match by name)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually importing data'
        )
        parser.add_argument(
            '--show-format',
            action='store_true',
            help='Show CSV format requirements and exit'
        )

    def handle(self, *args, **options):
        # Show format help if requested
        if options.get('show_format'):
            self.print_csv_format_help()
            return

        products_csv_path = options['products_csv']
        specs_csv_path = options.get('specs_csv')
        update_existing = options['update_existing']
        dry_run = options['dry_run']

        if not products_csv_path:
            raise CommandError('Products CSV file path is required unless using --show-format')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be imported'))

        # Validate file paths
        if not os.path.exists(products_csv_path):
            raise CommandError(f'Products CSV file does not exist: {products_csv_path}')
        
        if specs_csv_path and not os.path.exists(specs_csv_path):
            raise CommandError(f'Specifications CSV file does not exist: {specs_csv_path}')

        try:
            with transaction.atomic():
                # Import products
                products_imported = self.import_products(products_csv_path, update_existing, dry_run)
                
                # Import specifications if provided
                specs_imported = 0
                if specs_csv_path:
                    specs_imported = self.import_specifications(specs_csv_path, dry_run)

                if dry_run:
                    transaction.set_rollback(True)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'DRY RUN COMPLETED: Would import {products_imported} products '
                            f'and {specs_imported} specifications'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully imported {products_imported} products '
                            f'and {specs_imported} specifications'
                        )
                    )

        except Exception as e:
            raise CommandError(f'Import failed: {str(e)}')

    def import_products(self, csv_path, update_existing, dry_run):
        """Import products from CSV file."""
        imported_count = 0
        
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Detect delimiter
            sample = csvfile.read(1024)
            csvfile.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(csvfile, delimiter=delimiter)
            
            # Validate required columns
            required_columns = ['name', 'description', 'price', 'category']
            missing_columns = [col for col in required_columns if col not in reader.fieldnames]
            if missing_columns:
                raise CommandError(f'Missing required columns in products CSV: {missing_columns}')

            self.stdout.write(f'Found columns: {reader.fieldnames}')

            for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is headers
                try:
                    # Clean and validate data
                    name = row['name'].strip()
                    if not name:
                        self.stdout.write(
                            self.style.WARNING(f'Row {row_num}: Skipping product with empty name')
                        )
                        continue

                    description = row['description'].strip()
                    category_name = row['category'].strip()
                    
                    # Parse price
                    try:
                        price_str = row['price'].strip().replace('$', '').replace(',', '')
                        price = Decimal(price_str)
                    except (InvalidOperation, ValueError):
                        self.stdout.write(
                            self.style.WARNING(f'Row {row_num}: Invalid price "{row["price"]}" for product "{name}"')
                        )
                        continue

                    # Get or create category
                    if not dry_run:
                        category, created = Category.objects.get_or_create(
                            name=category_name,
                            defaults={'description': f'Category for {category_name}'}
                        )
                        if created:
                            self.stdout.write(f'Created new category: {category_name}')
                    else:
                        # For dry run, check if category exists
                        try:
                            category = Category.objects.get(name=category_name)
                        except Category.DoesNotExist:
                            self.stdout.write(f'Would create new category: {category_name}')
                            category = None

                    # Optional fields
                    in_stock = row.get('in_stock', 'true').strip().lower() in ['true', '1', 'yes', 'y']
                    tags = row.get('tags', '').strip()

                    # Check if product exists
                    product_exists = Product.objects.filter(name=name).exists()
                    
                    if product_exists and not update_existing:
                        self.stdout.write(
                            self.style.WARNING(f'Row {row_num}: Product "{name}" already exists, skipping')
                        )
                        continue

                    if not dry_run:
                        if product_exists and update_existing:
                            # Update existing product
                            product = Product.objects.get(name=name)
                            product.description = description
                            product.price = price
                            product.category = category
                            product.in_stock = in_stock
                            product.tags = tags
                            product.save()
                            self.stdout.write(f'Updated product: {name}')
                        else:
                            # Create new product
                            product = Product.objects.create(
                                name=name,
                                description=description,
                                price=price,
                                category=category,
                                in_stock=in_stock,
                                tags=tags
                            )
                            self.stdout.write(f'Created product: {name}')
                    else:
                        if product_exists and update_existing:
                            self.stdout.write(f'Would update product: {name}')
                        else:
                            self.stdout.write(f'Would create product: {name}')

                    imported_count += 1

                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Row {row_num}: Error processing product "{row.get("name", "Unknown")}": {str(e)}')
                    )
                    continue

        return imported_count

    def import_specifications(self, csv_path, dry_run):
        """Import product specifications from CSV file."""
        imported_count = 0
        
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Detect delimiter
            sample = csvfile.read(1024)
            csvfile.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(csvfile, delimiter=delimiter)
            
            # Validate required columns
            required_columns = ['product_name', 'key', 'value']
            missing_columns = [col for col in required_columns if col not in reader.fieldnames]
            if missing_columns:
                raise CommandError(f'Missing required columns in specifications CSV: {missing_columns}')

            self.stdout.write(f'Found specification columns: {reader.fieldnames}')

            for row_num, row in enumerate(reader, start=2):
                try:
                    product_name = row['product_name'].strip()
                    key = row['key'].strip()
                    value = row['value'].strip()
                    
                    if not all([product_name, key, value]):
                        self.stdout.write(
                            self.style.WARNING(f'Row {row_num}: Skipping specification with empty required fields')
                        )
                        continue

                    # Get order if provided
                    order = 0
                    if 'order' in row and row['order'].strip():
                        try:
                            order = int(row['order'].strip())
                        except ValueError:
                            self.stdout.write(
                                self.style.WARNING(f'Row {row_num}: Invalid order value "{row["order"]}", using 0')
                            )

                    if not dry_run:
                        # Find the product
                        try:
                            product = Product.objects.get(name=product_name)
                        except Product.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f'Row {row_num}: Product "{product_name}" not found, skipping specification')
                            )
                            continue

                        # Create or update specification
                        spec, created = ProductSpecification.objects.update_or_create(
                            product=product,
                            key=key,
                            defaults={'value': value, 'order': order}
                        )
                        
                        action = 'Created' if created else 'Updated'
                        self.stdout.write(f'{action} specification: {product_name} - {key}: {value}')
                    else:
                        # For dry run, check if product exists
                        if Product.objects.filter(name=product_name).exists():
                            self.stdout.write(f'Would create/update specification: {product_name} - {key}: {value}')
                        else:
                            self.stdout.write(f'Would skip specification (product not found): {product_name} - {key}: {value}')

                    imported_count += 1

                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Row {row_num}: Error processing specification: {str(e)}')
                    )
                    continue

        return imported_count

    def print_csv_format_help(self):
        """Print help information about CSV format."""
        self.stdout.write('\nCSV Format Requirements:')
        self.stdout.write('=' * 50)
        self.stdout.write('\nProducts CSV:')
        self.stdout.write('Required columns: name, description, price, category')
        self.stdout.write('Optional columns: in_stock, tags')
        self.stdout.write('\nExample:')
        self.stdout.write('name,description,price,category,in_stock,tags')
        self.stdout.write('Industrial Pump,High-efficiency pump,2499.99,Pumps,true,industrial,pump')
        
        self.stdout.write('\nSpecifications CSV (optional):')
        self.stdout.write('Required columns: product_name, key, value')
        self.stdout.write('Optional columns: order')
        self.stdout.write('\nExample:')
        self.stdout.write('product_name,key,value,order')
        self.stdout.write('Industrial Pump,Flow Rate,500 GPM,0')
        self.stdout.write('Industrial Pump,Head,150 ft,1')
