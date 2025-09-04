import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email


class Command(BaseCommand):
    help = 'Ensures that a superuser exists with the email from OWNER_EMAIL environment variable'

    def handle(self, *args, **options):
        owner_email = os.getenv('OWNER_EMAIL')
        
        if not owner_email:
            self.stdout.write(
                self.style.WARNING('OWNER_EMAIL environment variable not set. Skipping superuser creation.')
            )
            return

        # Validate email format
        try:
            validate_email(owner_email)
        except ValidationError:
            self.stdout.write(
                self.style.ERROR(f'Invalid email format: {owner_email}')
            )
            return

        # Check if superuser with this email already exists
        try:
            user = User.objects.get(email=owner_email, is_superuser=True)
            self.stdout.write(
                self.style.SUCCESS(f'Superuser with email {owner_email} already exists.')
            )
            return
        except User.DoesNotExist:
            pass

        # Check if there's a user with this email but not superuser
        try:
            user = User.objects.get(email=owner_email)
            if not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Existing user {owner_email} promoted to superuser.')
                )
                return
        except User.DoesNotExist:
            pass

        # Create new superuser
        username = owner_email.split('@')[0]  # Use email prefix as username
        
        # Ensure username is unique
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1

        # Get default password from environment or use a default
        default_password = os.getenv('OWNER_PASSWORD', 'admin123')

        try:
            user = User.objects.create_superuser(
                username=username,
                email=owner_email,
                password=default_password
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser created successfully:\n'
                    f'  Email: {owner_email}\n'
                    f'  Username: {username}\n'
                    f'  Password: {"Set from OWNER_PASSWORD env" if os.getenv("OWNER_PASSWORD") else "admin123 (default)"}'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )
