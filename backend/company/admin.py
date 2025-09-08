from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import CompanyInfo

@admin.register(CompanyInfo)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ['company_overview', 'contact_info', 'founded_display']
    readonly_fields = ['company_summary']
    
    def company_overview(self, obj):
        tagline_display = f'<em style="color: #3498db;">"{obj.tagline}"</em><br>' if obj.tagline else ""
        description = obj.description[:80] + "..." if len(obj.description or "") > 80 else obj.description or "No description"
        return format_html(
            '<div><strong style="color: #2c3e50; font-size: 16px;">🏢 {}</strong><br>{}<small style="color: #666;">{}</small></div>',
            obj.name,
            tagline_display,
            description
        )
    company_overview.short_description = "Company"
    
    def contact_info(self, obj):
        return format_html(
            '<div>📞 {}<br>📧 {}</div>',
            obj.phone or "No phone",
            obj.email or "No email"
        )
    contact_info.short_description = "Contact"
    
    def founded_display(self, obj):
        if obj.founded:
            return format_html(
                '<span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">Est. {}</span>',
                obj.founded
            )
        return "—"
    founded_display.short_description = "Founded"
    
    def company_summary(self, obj):
        if not obj.pk:
            return "Save to see company summary"
        
        return format_html(
            '''
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; color: #333;">
                <h3 style="margin-top: 0; color: #2c3e50;">🏢 Company Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p style="color: #333;"><strong style="color: #333;">Name:</strong> {}</p>
                        <p style="color: #333;"><strong style="color: #333;">Tagline:</strong> <em style="color: #3498db;">{}</em></p>
                        <p style="color: #333;"><strong style="color: #333;">Founded:</strong> {}</p>
                        <p style="color: #333;"><strong style="color: #333;">Phone:</strong> {}</p>
                        <p style="color: #333;"><strong style="color: #333;">Email:</strong> {}</p>
                        <p style="color: #333;"><strong style="color: #333;">Business Hours:</strong> {}</p>
                        <p style="color: #333;"><strong style="color: #333;">Business Days:</strong> {}</p>
                    </div>
                    <div>
                        <p style="color: #333;"><strong style="color: #333;">Address:</strong><br>{}</p>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <h4 style="color: #333;">Description:</h4>
                    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd; color: #333;">
                        {}
                    </div>
                </div>
            </div>
            ''',
            obj.name,
            obj.tagline or "No tagline",
            obj.founded or "Not specified",
            obj.phone or "Not specified",
            obj.email or "Not specified",
            obj.hours or "Not specified",
            obj.days or "Not specified",
            obj.address or "Not specified",
            obj.description or "No description provided"
        )
    company_summary.short_description = "Company Summary"
    
    fieldsets = (
        ('🏢 Basic Information', {
            'fields': ('name', 'tagline', 'founded', 'description'),
            'classes': ('wide',)
        }),
        ('📞 Contact Details', {
            'fields': ('phone', 'email', 'address', 'hours', 'days'),
            'classes': ('wide',)
        }),
        ('📊 Summary', {
            'fields': ('company_summary',),
            'classes': ('wide',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one company info record
        return not CompanyInfo.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of company info
        return False
