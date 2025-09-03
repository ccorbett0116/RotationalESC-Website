#!/usr/bin/env python3

import os
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rotational_equipment.settings')
django.setup()

from django.conf import settings
from django.db import connection

def test_database():
    print("=" * 50)
    print("DATABASE CONFIGURATION TEST")
    print("=" * 50)
    
    # Print database settings
    db_config = settings.DATABASES['default']
    print(f"Database Engine: {db_config['ENGINE']}")
    print(f"Database Name/Path: {db_config['NAME']}")
    
    # Check if database file exists
    db_path = Path(db_config['NAME'])
    print(f"Database file exists: {db_path.exists()}")
    print(f"Database file readable: {db_path.is_file() and os.access(db_path, os.R_OK)}")
    print(f"Database directory: {db_path.parent}")
    print(f"Database directory exists: {db_path.parent.exists()}")
    
    # Test database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT sqlite_version();")
            version = cursor.fetchone()[0]
            print(f"SQLite version: {version}")
            print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    print("=" * 50)

if __name__ == "__main__":
    test_database()
