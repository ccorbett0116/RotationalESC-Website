from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from .models import ContactSubmission
from .serializers import ContactSubmissionSerializer
from company.models import CompanyInfo

@api_view(['POST'])
def submit_contact_form(request):
    """
    Submit a contact form and send email notification
    """
    serializer = ContactSubmissionSerializer(data=request.data)
    
    if serializer.is_valid():
        # Save the submission to database
        submission = serializer.save()
        
        # Prepare email content
        subject_dict = dict(ContactSubmission.SUBJECT_CHOICES)
        email_subject = f"New Contact Form Submission - {subject_dict.get(submission.subject, 'General Inquiry')}"
        
        # Email content
        email_body = f"""
New contact form submission received:

Name: {submission.name}
Email: {submission.email}
Phone: {submission.phone or 'Not provided'}
Company: {submission.company or 'Not provided'}
Subject: {subject_dict.get(submission.subject, 'General Inquiry')}

Message:
{submission.message}

Submitted on: {submission.created_at.strftime('%B %d, %Y at %I:%M %p')}
        """
        
        try:
            # Send email notification to owner
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.OWNER_EMAIL],
                fail_silently=False,
            )
            
            # Get company info for email
            try:
                company_info = CompanyInfo.objects.first()
                company_name = company_info.name if company_info else "Rotational Equipment Services"
            except CompanyInfo.DoesNotExist:
                company_name = "Rotational Equipment Services"
            
            # Send confirmation email to customer
            confirmation_subject = f"Thank you for contacting {company_name}"
            confirmation_body = f"""
Dear {submission.name},

Thank you for contacting {company_name}. We have received your message regarding "{subject_dict.get(submission.subject, 'General Inquiry')}" and will get back to you within 24 hours.

Your message:
{submission.message}

Best regards,
{company_name} Team
            """
            
            send_mail(
                subject=confirmation_subject,
                message=confirmation_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[submission.email],
                fail_silently=True,  # Don't fail if customer email fails
            )
            
            return Response({
                'message': 'Contact form submitted successfully. We will get back to you soon!',
                'submission_id': submission.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Email failed but form was saved
            return Response({
                'message': 'Contact form submitted successfully, but there was an issue sending the email notification.',
                'submission_id': submission.id,
                'error': str(e)
            }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
