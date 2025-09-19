from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<uuid:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<uuid:product_id>/image/<int:image_id>/', views.ProductImageView.as_view(), name='product-image'),
    path('products/<uuid:product_id>/related/', views.related_products, name='related-products'),
    path('products/search/', views.product_search, name='product-search'),
    path('products/<uuid:product_id>/upload-image/', views.upload_product_image, name='upload-product-image'),
    path('products/import-csv/', views.import_products_csv, name='import-products-csv'),
    
    # Sections and Manufacturers
    path('sections/', views.SectionListView.as_view(), name='section-list'),
    path('sections/<int:pk>/', views.SectionDetailView.as_view(), name='section-detail'),
    path('manufacturers/', views.ManufacturerListView.as_view(), name='manufacturer-list'),
    path('manufacturers/<int:pk>/', views.ManufacturerDetailView.as_view(), name='manufacturer-detail'),
    path('manufacturers/upload/', views.upload_manufacturer, name='upload-manufacturer'),
    path('sections-with-manufacturers/', views.sections_with_manufacturers, name='sections-with-manufacturers'),
    
    # Gallery
    path('gallery/', views.GalleryListView.as_view(), name='gallery-list'),
    path('gallery/<int:image_id>/image/', views.GalleryImageView.as_view(), name='gallery-image'),
    path('new-gallery/', views.NewGalleryListView.as_view(), name='new-gallery-list'),
    path('new-gallery/<int:image_id>/image/', views.NewGalleryImageView.as_view(), name='new-gallery-image'),
]
