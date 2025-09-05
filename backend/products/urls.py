from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<uuid:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/search/', views.product_search, name='product-search'),
    path('products/<uuid:product_id>/upload-image/', views.upload_product_image, name='upload-product-image'),
    
    # Sections and Manufacturers
    path('sections/', views.SectionListView.as_view(), name='section-list'),
    path('sections/<int:pk>/', views.SectionDetailView.as_view(), name='section-detail'),
    path('manufacturers/', views.ManufacturerListView.as_view(), name='manufacturer-list'),
    path('manufacturers/<int:pk>/', views.ManufacturerDetailView.as_view(), name='manufacturer-detail'),
    path('manufacturers/upload/', views.upload_manufacturer, name='upload-manufacturer'),
    path('sections-with-manufacturers/', views.sections_with_manufacturers, name='sections-with-manufacturers'),
]
