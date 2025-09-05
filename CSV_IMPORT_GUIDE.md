# Product CSV Import Guide

This guide explains how to import products and their specifications via CSV files using Django management commands.

## Management Command Usage

### Import Products Only
```bash
python manage.py import_products_csv /path/to/products.csv
```

### Import Products and Specifications
```bash
python manage.py import_products_csv /path/to/products.csv --specs-csv /path/to/specifications.csv
```

### Update Existing Products
```bash
python manage.py import_products_csv /path/to/products.csv --update-existing
```

### Dry Run (Test Import)
```bash
python manage.py import_products_csv /path/to/products.csv --dry-run
```

### Show CSV Format Help
```bash
python manage.py import_products_csv --show-format
```

## CSV File Formats

### Products CSV Format

**Required columns:**
- `name` - Product name (must be unique if not updating existing)
- `description` - Product description
- `price` - Product price (decimal, can include $ and commas)
- `category` - Category name (will be created if it doesn't exist)

**Optional columns:**
- `in_stock` - Boolean (true/false, 1/0, yes/no, y/n)
- `tags` - Comma-separated tags

**Example:**
```csv
name,description,price,category,in_stock,tags
Industrial Pump,High-efficiency pump,2499.99,Pumps,true,"industrial,pump"
Rotary Compressor,Energy-efficient compressor,$15,999.99,Compressors,true,"compressor,energy-efficient"
```

### Specifications CSV Format (Optional)

**Required columns:**
- `product_name` - Must match exact product name from products CSV
- `key` - Specification name (e.g., "Flow Rate", "Power")
- `value` - Specification value (e.g., "500 GPM", "25 HP")

**Optional columns:**
- `order` - Display order (integer, default: 0)

**Example:**
```csv
product_name,key,value,order
Industrial Pump,Flow Rate,500 GPM,0
Industrial Pump,Head,150 ft,1
Industrial Pump,Power,25 HP,2
```

## Sample Files

See the `sample_csv/` directory for example files:
- `sample_products.csv` - Example products file
- `sample_specifications.csv` - Example specifications file

## Django Admin Export

You can export existing products and specifications to CSV format from the Django admin:

1. Go to Products admin page
2. Select products you want to export
3. Choose "Export selected products to CSV" action
4. Click "Go"

Same process works for specifications in the Product Specifications admin page.

## Notes

- Categories will be automatically created if they don't exist
- Product names are used as unique identifiers for specifications
- Images are not imported via CSV - they must be added through the admin interface
- The import process is wrapped in a database transaction for safety
- Use `--dry-run` to test your CSV files before actual import
- Price values can include currency symbols and commas (e.g., "$1,234.56")
- Boolean values accept various formats: true/false, 1/0, yes/no, y/n (case insensitive)

## Error Handling

The import command will:
- Skip rows with missing required data
- Display warnings for invalid data
- Continue processing even if some rows fail
- Show a summary of successful imports
- Roll back all changes if a critical error occurs
