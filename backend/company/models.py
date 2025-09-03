from django.db import models

class CompanyInfo(models.Model):
    name = models.CharField(max_length=200, default="Rotational Equipment Services")
    tagline = models.CharField(max_length=300)
    description = models.TextField()
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    hours = models.CharField(max_length=200)
    founded = models.CharField(max_length=10)
    employees = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company Information"
        verbose_name_plural = "Company Information"

    def __str__(self):
        return self.name
