from django.db import models

class ContactSubmission(models.Model):
    SUBJECT_CHOICES = [
        ('quote', 'Request Quote'),
        ('support', 'Technical Support'),
        ('maintenance', 'Maintenance Service'),
        ('parts', 'Parts & Repair'),
        ('general', 'General Inquiry'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=100, blank=True)
    subject = models.CharField(max_length=20, choices=SUBJECT_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.get_subject_display()}"
    
    class Meta:
        ordering = ['-created_at']
