"""
URL configuration for rotational_equipment project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

# Configure admin titles
admin.site.site_header = "Rotational Equipment Services Admin"
admin.site.site_title = "RES Admin Portal"
admin.site.index_title = "Welcome to RES Administration"

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'csrfToken': 'token'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf-token/', csrf_token_view, name='csrf-token'),
    path('api/', include('products.urls')),
    path('api/equipment/', include('equipment.urls')),
    path('api/', include('orders.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/company/', include('company.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/galleries/', include('galleries.urls')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
