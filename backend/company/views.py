from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CompanyInfo
from .serializers import CompanyInfoSerializer

class CompanyInfoView(generics.RetrieveAPIView):
    """
    Get company information. Since there should only be one company info record,
    this will return the first (and likely only) record.
    """
    serializer_class = CompanyInfoSerializer
    
    def get_object(self):
        return CompanyInfo.objects.first()

@api_view(['GET'])
def company_info(request):
    """
    Simple function-based view to get company information
    """
    company = CompanyInfo.objects.first()
    if company:
        serializer = CompanyInfoSerializer(company)
        return Response(serializer.data)
    else:
        return Response({'error': 'Company information not found'}, status=404)
