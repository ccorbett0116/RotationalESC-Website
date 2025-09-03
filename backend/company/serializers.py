from rest_framework import serializers
from .models import CompanyInfo

class CompanyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyInfo
        fields = [
            'id', 'name', 'tagline', 'description', 'address', 
            'phone', 'email', 'hours', 'founded', 'employees'
        ]
