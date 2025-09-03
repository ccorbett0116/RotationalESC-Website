from django.contrib import admin
from .models import ContactSubmission

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'created_at']
    list_filter = ['subject', 'created_at']
    search_fields = ['name', 'email', 'company']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
