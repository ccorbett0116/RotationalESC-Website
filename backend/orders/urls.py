from django.urls import path
from . import views

urlpatterns = [
    path('orders/calculate-total/', views.calculate_order_total, name='calculate-order-total'),
    path('orders/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
]
