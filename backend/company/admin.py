from django.contrib import admin
from .models import CompanyInfo

@admin.register(CompanyInfo)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'founded']
    
    def has_add_permission(self, request):
        # Only allow one company info record
        return not CompanyInfo.objects.exists()
