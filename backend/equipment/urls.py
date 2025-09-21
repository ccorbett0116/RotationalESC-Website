from django.urls import path
from . import views

urlpatterns = [
    # Equipment Categories
    path('categories/', views.EquipmentCategoryListView.as_view(), name='equipment-categories'),
    path('categories/<slug:slug>/', views.equipment_category_detail, name='equipment-category-detail'),
    
    # Sections
    path('sections/', views.SectionListView.as_view(), name='sections'),
    path('sections/<int:pk>/', views.SectionDetailView.as_view(), name='section-detail'),
    path('sections/with-manufacturers/', views.sections_with_manufacturers, name='sections-with-manufacturers'),
    
    # Manufacturers
    path('manufacturers/', views.ManufacturerListView.as_view(), name='manufacturers'),
    path('manufacturers/<int:pk>/', views.ManufacturerDetailView.as_view(), name='manufacturer-detail'),
    path('manufacturers/upload/', views.upload_manufacturer, name='upload-manufacturer'),
]