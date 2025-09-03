from django.urls import path
from . import views

urlpatterns = [
    path('info/', views.company_info, name='company-info'),
]
