#!/usr/bin/env python3
"""
Simple script to test the Django API endpoints
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoints():
    print("Testing Django API Endpoints...")
    print("="*50)
    
    # Test categories
    print("\n1. Testing Categories:")
    response = requests.get(f"{BASE_URL}/categories/")
    if response.status_code == 200:
        categories = response.json()
        print(f"✓ Found {len(categories)} categories")
        for cat in categories:
            print(f"  - {cat['name']}")
    else:
        print(f"✗ Error: {response.status_code}")
    
    # Test products list
    print("\n2. Testing Products List:")
    response = requests.get(f"{BASE_URL}/products/")
    if response.status_code == 200:
        data = response.json()
        products = data.get('results', data)  # Handle pagination
        print(f"✓ Found {len(products)} products")
        for product in products[:3]:  # Show first 3
            print(f"  - {product['name']} (${product['price']})")
    else:
        print(f"✗ Error: {response.status_code}")
    
    # Test product detail
    print("\n3. Testing Product Detail:")
    response = requests.get(f"{BASE_URL}/products/1/")
    if response.status_code == 200:
        product = response.json()
        print(f"✓ Product: {product['name']}")
        print(f"  Category: {product['category']['name']}")
        print(f"  Price: ${product['price']}")
        print(f"  Specifications: {len(product['specifications'])}")
    else:
        print(f"✗ Error: {response.status_code}")
    
    # Test product search
    print("\n4. Testing Product Search:")
    response = requests.get(f"{BASE_URL}/products/search/?q=pump")
    if response.status_code == 200:
        products = response.json()
        print(f"✓ Found {len(products)} products matching 'pump'")
    else:
        print(f"✗ Error: {response.status_code}")

if __name__ == "__main__":
    try:
        test_endpoints()
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to Django server. Make sure it's running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"✗ Error: {e}")
