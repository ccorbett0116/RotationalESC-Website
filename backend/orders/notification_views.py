from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .email_service import OrderEmailService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def notify_payment_cancelled(request, order_number):
    """
    Notify owner when customer cancels payment or reaches payment failed page
    """
    try:
        order = Order.objects.get(order_number=order_number)
        reason = request.data.get('reason', 'Payment cancelled by customer')
        
        # Send email notification to owner
        success = OrderEmailService.send_payment_failed_notification(order, reason)
        
        if success:
            return Response({'message': 'Notification sent successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to send notification'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error sending payment cancellation notification: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
