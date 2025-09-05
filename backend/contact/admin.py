from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import ContactSubmission

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['contact_info', 'subject_display', 'company_info', 'submission_date', 'actions_column']
    list_filter = ['subject', 'created_at']
    search_fields = ['name', 'email', 'company', 'subject', 'message']
    readonly_fields = ['created_at', 'message_preview']
    ordering = ['-created_at']
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    def contact_info(self, obj):
        return format_html(
            '<div><strong style="color: #2c3e50;">👤 {}</strong><br><small style="color: #666;">📧 {}</small></div>',
            obj.name,
            obj.email
        )
    contact_info.short_description = "Contact"
    contact_info.admin_order_field = 'name'
    
    def subject_display(self, obj):
        subject_colors = {
            'general': '#17a2b8',
            'support': '#f39c12',
            'sales': '#27ae60',
            'quote': '#e74c3c'
        }
        color = subject_colors.get(obj.subject, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">{}</span>',
            color,
            obj.get_subject_display()
        )
    subject_display.short_description = "Subject"
    subject_display.admin_order_field = 'subject'
    
    def company_info(self, obj):
        if obj.company:
            return format_html(
                '<span style="background: #e9ecef; padding: 2px 6px; border-radius: 6px; font-size: 11px;">🏢 {}</span>',
                obj.company
            )
        return format_html('<span style="color: #999;">—</span>')
    company_info.short_description = "Company"
    company_info.admin_order_field = 'company'
    
    def submission_date(self, obj):
        return format_html(
            '<span style="color: #666;">{}</span><br><small>{}</small>',
            obj.created_at.strftime('%Y-%m-%d'),
            obj.created_at.strftime('%H:%M')
        )
    submission_date.short_description = "Submitted"
    submission_date.admin_order_field = 'created_at'
    
    def actions_column(self, obj):
        return format_html(
            '<a href="mailto:{}?subject=Re: {}" style="color: #3498db; text-decoration: none;">📧 Reply</a>',
            obj.email,
            obj.get_subject_display()
        )
    actions_column.short_description = "Actions"
    
    def message_preview(self, obj):
        if not obj.message:
            return "No message"
        
        return format_html(
            '''
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                <h4 style="margin-top: 0; color: #2c3e50;">💬 Message Content</h4>
                <div style="white-space: pre-wrap; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 13px; line-height: 1.4;">
                    {}
                </div>
            </div>
            ''',
            obj.message
        )
    message_preview.short_description = "Message Preview"
    
    fieldsets = (
        ('👤 Contact Information', {
            'fields': ('name', 'email', 'company'),
            'classes': ('wide',)
        }),
        ('📝 Submission Details', {
            'fields': ('subject', 'created_at'),
            'classes': ('wide',)
        }),
        ('💬 Message', {
            'fields': ('message_preview',),
            'classes': ('wide',)
        }),
    )
