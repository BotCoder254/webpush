from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.pagination import CursorPagination
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.db import models
import json
import hmac
import hashlib
from django.conf import settings
from apps.webhooks.models import WebhookEndpoint, WebhookEvent, WebhookDelivery
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'message': 'WebHook Platform API is running'
    }, status=status.HTTP_200_OK)


def get_client_ip(request):
    """Get the real client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@csrf_exempt
def webhook_receiver(request, path_token):
    """
    Enhanced webhook receiver endpoint with proper event ingestion
    URL pattern: /webhook/<path_token>/
    """
    if request.method not in ['POST', 'GET', 'PUT', 'PATCH', 'DELETE']:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    start_time = timezone.now()
    
    try:
        # Find the webhook endpoint
        endpoint = WebhookEndpoint.objects.get(path_token=path_token, status='active')
    except WebhookEndpoint.DoesNotExist:
        return JsonResponse({'error': 'Webhook endpoint not found'}, status=404)
    
    # Extract request metadata
    source_ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    content_type = request.content_type or ''
    request_id = request.META.get('HTTP_X_REQUEST_ID', '')
    event_type = request.META.get('HTTP_X_EVENT_TYPE', 'webhook.received')
    signature_header = request.META.get('HTTP_X_SIGNATURE', '')
    
    # Get raw body
    raw_body = request.body.decode('utf-8') if request.body else ''
    
    # Parse payload
    try:
        if content_type == 'application/json' and raw_body:
            payload = json.loads(raw_body)
        else:
            payload = {'raw_data': raw_body} if raw_body else {}
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        payload = {'raw_data': raw_body, 'parse_error': str(e)}
    
    # Extract all headers for storage
    raw_headers = {}
    for key, value in request.META.items():
        if key.startswith('HTTP_'):
            header_name = key[5:].replace('_', '-').lower()
            raw_headers[header_name] = value
        elif key in ['CONTENT_TYPE', 'CONTENT_LENGTH']:
            raw_headers[key.lower().replace('_', '-')] = value
    
    # Check for duplicates using request_id and body_hash
    body_hash = hashlib.sha256(raw_body.encode()).hexdigest() if raw_body else ''
    is_duplicate = False
    
    if request_id:
        # Check for duplicate by request_id
        existing_event = WebhookEvent.objects.filter(
            endpoint=endpoint,
            request_id=request_id
        ).first()
        if existing_event:
            is_duplicate = True
    elif body_hash:
        # Check for duplicate by body_hash (last 5 minutes)
        five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
        existing_event = WebhookEvent.objects.filter(
            endpoint=endpoint,
            body_hash=body_hash,
            created_at__gte=five_minutes_ago
        ).first()
        if existing_event:
            is_duplicate = True
    
    # Verify signature if present
    signature_valid = True
    if signature_header:
        # Extract the actual signature from the header (remove "sha256=" prefix if present)
        received_signature = signature_header
        if signature_header.startswith('sha256='):
            received_signature = signature_header[7:]  # Remove "sha256=" prefix
        
        # Generate expected signature using raw request body
        expected_signature = generate_signature(endpoint.decrypt_secret(), request.body)
        if expected_signature.startswith('sha256='):
            expected_signature = expected_signature[7:]  # Remove "sha256=" prefix
        
        # Compare signatures securely
        signature_valid = hmac.compare_digest(received_signature, expected_signature)
        if not signature_valid:
            logger.warning(f'Invalid signature for endpoint {endpoint.name} from IP {source_ip}')
            logger.warning(f'Received signature: {received_signature}')
            logger.warning(f'Expected signature: {expected_signature}')
            logger.warning(f'Request body: {request.body}')
            logger.warning(f'Secret: {endpoint.decrypt_secret()}')
            logger.warning(f'Signature header: {signature_header}')
            
            # Also log the raw request data for debugging
            logger.warning(f'Request method: {request.method}')
            logger.warning(f'Request content type: {request.content_type}')
            logger.warning(f'Request headers: {dict(request.headers)}')
    
    # Create webhook event (always create, even if duplicate for auditing)
    try:
        event = WebhookEvent.objects.create(
            endpoint=endpoint,
            event_type=event_type,
            data=payload,
            raw_body=raw_body,
            raw_headers=raw_headers,
            signature=signature_header,
            source_ip=source_ip,
            user_agent=user_agent,
            content_type=content_type,
            body_hash=body_hash,
            request_id=request_id,
            is_duplicate=is_duplicate,
            status='processed' if signature_valid else 'failed',
            error_message='' if signature_valid else 'Invalid signature'
        )
        
        # Update endpoint last used
        endpoint.last_used_at = timezone.now()
        endpoint.save(update_fields=['last_used_at'])
        
        # Send WebSocket notification (gracefully handle Redis connection failures)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                try:
                    # Serialize event for WebSocket
                    from apps.webhooks.serializers import WebhookEventSerializer
                    event_data = WebhookEventSerializer(event).data
                    
                    # Send to user's event group
                    async_to_sync(channel_layer.group_send)(
                        f'events_{endpoint.user.id}',
                        {
                            'type': 'new_event',
                            'event': event_data
                        }
                    )
                    logger.info(f'WebSocket notification sent for event {event.id}')
                except Exception as redis_error:
                    logger.warning(f'Redis connection failed, WebSocket notification skipped: {redis_error}')
                    # Don't fail the webhook request if Redis is down
        except Exception as e:
            logger.warning(f'WebSocket notification failed: {e}')
            # Don't fail the webhook request if WebSocket fails
        
        # Log activity
        from .models import log_activity
        log_activity(
            user=endpoint.user,
            actor='system',
            activity_type='WEBHOOK_RECEIVED',
            title=f'Webhook received on {endpoint.name}',
            description=f'Event type: {event_type} from IP {source_ip}',
            target_type='event',
            target_id=str(event.id),
            metadata={
                'endpoint_name': endpoint.name,
                'event_type': event_type,
                'source_ip': source_ip,
                'is_duplicate': is_duplicate,
                'body_size': len(raw_body) if raw_body else 0,
                'signature_valid': signature_valid
            },
            ip_address=source_ip,
            user_agent=user_agent,
            is_system=True
        )
        
        logger.info(
            f'Webhook event created: {event.id} for endpoint {endpoint.name} '
            f'from IP {source_ip} (duplicate: {is_duplicate})'
        )
        
        # Return appropriate response
        if not signature_valid:
            return JsonResponse({
                'error': 'Invalid signature',
                'event_id': str(event.id)
            }, status=401)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Webhook received successfully',
            'event_id': str(event.id),
            'duplicate': is_duplicate
        }, status=200)
        
    except Exception as e:
        logger.error(f'Failed to create webhook event: {str(e)}')
        return JsonResponse({
            'error': 'Internal server error',
            'message': 'Failed to process webhook'
        }, status=503)


def generate_signature(secret, body):
    """Generate HMAC signature for webhook payload"""
    # Ensure secret is bytes
    if isinstance(secret, str):
        secret = secret.encode('utf-8')
    
    # Ensure body is bytes
    if isinstance(body, str):
        body = body.encode('utf-8')
    
    signature = hmac.new(
        secret,
        body,
        hashlib.sha256
    ).hexdigest()
    return f'sha256={signature}'


@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """API information endpoint"""
    return Response({
        'name': 'WebHook Platform API',
        'version': '1.0.0',
        'description': 'Modern webhook platform with user management and endpoint monitoring',
        'endpoints': {
            'authentication': '/api/auth/',
            'webhooks': '/api/webhooks/',
            'webhook_receiver': '/webhook/<path_token>/',
            'health': '/api/health/',
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def webhook_debug(request, path_token):
    """Debug endpoint to view webhook data without signature verification"""
    try:
        # Find the webhook endpoint
        from apps.webhooks.models import WebhookEndpoint
        endpoint = WebhookEndpoint.objects.get(path_token=path_token)
        
        # Get recent events for this endpoint
        from apps.webhooks.models import WebhookEvent
        recent_events = WebhookEvent.objects.filter(
            endpoint=endpoint
        ).order_by('-created_at')[:10]
        
        events_data = []
        for event in recent_events:
            events_data.append({
                'id': str(event.id),
                'event_type': event.event_type,
                'data': event.data,
                'raw_body': event.raw_body,
                'raw_headers': event.raw_headers,
                'source_ip': event.source_ip,
                'user_agent': event.user_agent,
                'content_type': event.content_type,
                'signature': event.signature,
                'status': event.status,
                'error_message': event.error_message,
                'created_at': event.created_at.isoformat(),
                'is_duplicate': event.is_duplicate
            })
        
        return Response({
            'endpoint': {
                'name': endpoint.name,
                'path_token': endpoint.path_token,
                'url': f"{request.build_absolute_uri('/')}webhook/{path_token}/",
                'secret': endpoint.decrypt_secret(),
                'created_at': endpoint.created_at.isoformat(),
                'last_used_at': endpoint.last_used_at.isoformat() if endpoint.last_used_at else None
            },
            'recent_events': events_data,
            'total_events': WebhookEvent.objects.filter(endpoint=endpoint).count()
        }, status=status.HTTP_200_OK)
        
    except WebhookEndpoint.DoesNotExist:
        return Response({
            'error': 'Webhook endpoint not found',
            'path_token': path_token
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Internal server error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Activity Log Views
class ActivityCursorPagination(CursorPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'
    cursor_query_param = 'cursor'


class ActivityLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ActivityCursorPagination
    
    def get_queryset(self):
        from .models import ActivityLog
        
        queryset = ActivityLog.objects.filter(
            user=self.request.user
        ).select_related('user').order_by('-created_at')
        
        # Apply filters
        activity_type = self.request.query_params.get('type')
        is_system = self.request.query_params.get('is_system')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        target_type = self.request.query_params.get('target_type')
        
        if activity_type:
            queryset = queryset.filter(type=activity_type)
        
        if is_system is not None:
            queryset = queryset.filter(is_system=is_system.lower() == 'true')
        
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(type__icontains=search)
            )
        
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        
        if date_from:
            try:
                from django.utils.dateparse import parse_datetime
                date_from_parsed = parse_datetime(date_from)
                if date_from_parsed:
                    queryset = queryset.filter(created_at__gte=date_from_parsed)
            except ValueError:
                pass
        
        if date_to:
            try:
                from django.utils.dateparse import parse_datetime
                date_to_parsed = parse_datetime(date_to)
                if date_to_parsed:
                    queryset = queryset.filter(created_at__lte=date_to_parsed)
            except ValueError:
                pass
        
        return queryset
    
    def get_serializer_class(self):
        from .serializers import ActivityLogSerializer
        return ActivityLogSerializer


class ActivityLogDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from .models import ActivityLog
        return ActivityLog.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        from .serializers import ActivityLogDetailSerializer
        return ActivityLogDetailSerializer
