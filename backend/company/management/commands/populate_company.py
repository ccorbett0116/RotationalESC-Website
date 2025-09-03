from django.core.management.base import BaseCommand
from company.models import CompanyInfo

class Command(BaseCommand):
    help = 'Populate company information in the database'

    def handle(self, *args, **options):
        # Clear existing company info
        CompanyInfo.objects.all().delete()
        
        # Create new company info
        company = CompanyInfo.objects.create(
            name="Rotational Equipment Services",
            tagline="Your trusted partner for industrial rotational equipment",
            description="We provide comprehensive services for industrial rotational equipment including pumps, compressors, motors, bearings, and seals. Our experienced team delivers reliable solutions for maintenance, repair, and optimization of your critical equipment.",
            address="1234 Industrial Blvd, Equipment City, EC 12345",
            phone="(555) 123-4567",
            email="info@rotationalequipment.com",
            hours="Monday - Friday: 8:00 AM - 5:00 PM",
            founded="1985",
            employees="50+"
        )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated company information')
        )
