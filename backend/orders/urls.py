from django.urls import path
from . import views

urlpatterns = [
    path('orders/calculate-total/', views.calculate_order_total, name='calculate-order-total'),
    path('orders/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/confirm-payment/', views.confirm_payment, name='confirm-payment'),
    path('orders/<str:order_number>/create-checkout-session/', views.create_checkout_session, name='create-checkout-session'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
]
