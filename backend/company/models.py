from django.db import models

class CompanyInfo(models.Model):
    name = models.CharField(max_length=200, blank=True, null=True)
    tagline = models.CharField(max_length=300, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    hours = models.CharField(max_length=200, blank=True, null=True)
    days = models.CharField(max_length=100, blank=True, null=True)
    founded = models.CharField(max_length=10, blank=True, null=True)
    employees = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company Information"
        verbose_name_plural = "Company Information"

    def __str__(self):
        return self.name
