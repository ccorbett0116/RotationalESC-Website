from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<uuid:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/search/', views.product_search, name='product-search'),
    path('products/<uuid:product_id>/upload-image/', views.upload_product_image, name='upload-product-image'),
]
