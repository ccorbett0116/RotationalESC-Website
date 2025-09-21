from django.urls import path
from . import views

urlpatterns = [
    # Gallery Categories
    path('categories/', views.gallery_categories, name='gallery-categories'),
    path('<slug:slug>/', views.gallery_category_detail, name='gallery-category-detail'),
    path('<slug:slug>/images/<int:image_id>/', views.GalleryImageView.as_view(), name='gallery-image'),
]