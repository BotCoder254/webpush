from rest_framework import status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from .models import WebhookEndpoint, WebhookDelivery, WebhookEvent, WebhookReplay, WebhookForward
from .serializers import (
    WebhookEndpointSerializer,
    WebhookEndpointCreateSerializer,
    WebhookEndpointDetailSerializer,
    WebhookDeliverySerializer,
    WebhookEventSerializer,
    WebhookEventDetailSerializer,
    WebhookTestSerializer,
    WebhookSecretRotateSerializer
)


class WebhookEndpointViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WebhookEndpoint.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WebhookEndpointCreateSerializer
        elif self.action == 'retrieve':
            return WebhookEndpointDetailSerializer
        return WebhookEndpointSerializer
    
    def perform_create(self, serializer):
        endpoint = serializer.save(user=self.request.user)
        
        # Log activity
        from apps.core.models import log_activity
        log_activity(
            user=self.request.user,
            actor=self.request.user.email if self.request.user else 'system',
            activity_type='WEBHOOK_CREATED',
            title=f'Webhook endpoint created: {endpoint.name}',
            description=f'New webhook endpoint "{endpoint.name}" was created',
            target_type='webhook',
            target_id=str(endpoint.id),
            metadata={
                'webhook_name': endpoint.name,
                'status': endpoint.status,
                'endpoint_url': f'/webhook/{endpoint.path_token}/'
            },
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            is_system=False
        )
    
    @action(detail=True, methods=['post'])
    def rotate_secret(self, request, pk=None):
        endpoint = self.get_object()
        serializer = WebhookSecretRotateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_secret = endpoint.rotate_secret()
        
        # Log activity
        from apps.core.models import log_activity
        log_activity(
            user=self.request.user,
            actor=self.request.user.email if self.request.user else 'system',
            activity_type='SECRET_ROTATED',
            title=f'Secret rotated for {endpoint.name}',
            description=f'Webhook secret was rotated for endpoint "{endpoint.name}"',
            target_type='webhook',
            target_id=str(endpoint.id),
            metadata={
                'webhook_name': endpoint.name,
                'action': 'secret_rotation',
            },
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            is_system=False
        )
        
        return Response({
            'message': 'Secret rotated successfully',
            'new_secret': new_secret,
            'masked_secret': endpoint.masked_secret
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def secret(self, request, pk=None):
        endpoint = self.get_object()
        return Response({
            'secret': endpoint.decrypt_secret()
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        endpoint = self.get_object()
        serializer = WebhookTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create a test event
        event = WebhookEvent.objects.create(
            endpoint=endpoint,
            event_type=serializer.validated_data['event_type'],
            data=serializer.validated_data['payload']
        )
        
        # Create a test delivery
        delivery = WebhookDelivery.objects.create(
            endpoint=endpoint,
            payload=serializer.validated_data['payload'],
            headers={'Content-Type': 'application/json'},
            status='delivered',
            response_status_code=200,
            delivery_attempts=1,
            delivered_at=timezone.now()
        )
        
        endpoint.last_used_at = timezone.now()
        endpoint.save()
        
        return Response({
            'message': 'Test webhook sent successfully',
            'event_id': event.id,
            'delivery_id': delivery.id
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        endpoint = self.get_object()
        deliveries = endpoint.deliveries.all()
        
        page = self.paginate_queryset(deliveries)
        if page is not None:
            serializer = WebhookDeliverySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = WebhookDeliverySerializer(deliveries, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        endpoint = self.get_object()
        events = endpoint.events.all()
        
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = WebhookEventSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = WebhookEventSerializer(events, many=True)
        return Response(serializer.data)


class WebhookDeliveryDetailView(generics.RetrieveAPIView):
    serializer_class = WebhookDeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WebhookDelivery.objects.filter(endpoint__user=self.request.user)


class WebhookEventDetailView(generics.RetrieveAPIView):
    serializer_class = WebhookEventDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WebhookEvent.objects.filter(
            endpoint__user=self.request.user
        ).prefetch_related('replays', 'forwards')


from rest_framework.pagination import CursorPagination

class EventsCursorPagination(CursorPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000
    ordering = '-created_at'
    cursor_query_param = 'cursor'
    page_query_param = 'page'

class WebhookEventListView(generics.ListAPIView):
    serializer_class = WebhookEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = EventsCursorPagination
    
    def get_queryset(self):
        queryset = WebhookEvent.objects.filter(
            endpoint__user=self.request.user
        ).select_related('endpoint').order_by('-created_at')
        
        # Apply filters
        endpoint_id = self.request.query_params.get('endpoint_id')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        is_duplicate = self.request.query_params.get('is_duplicate')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if endpoint_id:
            queryset = queryset.filter(endpoint_id=endpoint_id)
        
        if status:
            queryset = queryset.filter(status=status)
            
        if is_duplicate is not None:
            queryset = queryset.filter(is_duplicate=is_duplicate.lower() == 'true')
        
        if search:
            # Use database text search for better performance
            queryset = queryset.filter(
                models.Q(event_type__icontains=search) |
                models.Q(raw_body__icontains=search) |
                models.Q(source_ip__icontains=search) |
                models.Q(request_id__icontains=search)
            )
        
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def replay_event(request, event_id):
    """Replay a webhook event to a specified URL"""
    try:
        event = WebhookEvent.objects.get(
            id=event_id, 
            endpoint__user=request.user
        )
    except WebhookEvent.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    target_url = request.data.get('target_url')
    if not target_url:
        return Response({'error': 'target_url is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create replay record
    replay = WebhookReplay.objects.create(
        original_event=event,
        target_url=target_url,
        status='pending'
    )
    
    # Send HTTP request to replay the event
    import requests
    try:
        # Prepare headers
        headers = {
            'Content-Type': event.content_type or 'application/json',
            'X-Webhook-Replay': 'true',
            'X-Original-Event-Id': str(event.id),
            'X-Event-Type': event.event_type,
            'User-Agent': 'WebhookPlatform/1.0',
        }
        
        # Add original headers if available
        if event.raw_headers:
            for key, value in event.raw_headers.items():
                if key.lower() not in ['host', 'content-length', 'authorization']:
                    headers[f'X-Original-{key}'] = value
        
        # Send the request
        response = requests.post(
            target_url,
            data=event.raw_body,
            headers=headers,
            timeout=30,
            allow_redirects=True
        )
        
        replay.status = 'sent'
        replay.response_status_code = response.status_code
        replay.response_body = response.text[:1000]  # Limit response body
        replay.replayed_at = timezone.now()
        
    except requests.exceptions.RequestException as e:
        replay.status = 'failed'
        replay.error_message = f'Request failed: {str(e)}'
    except Exception as e:
        replay.status = 'failed'
        replay.error_message = f'Unexpected error: {str(e)}'
    
    replay.save()
    
    # Log activity
    from apps.core.models import log_activity
    log_activity(
        user=request.user,
        actor=request.user.email if request.user else 'system',
        activity_type='REPLAY_TRIGGERED' if replay.status == 'sent' else 'REPLAY_FAILED',
        title=f'Event replay {"succeeded" if replay.status == "sent" else "failed"}',
        description=f'Event {event.id} was {"successfully replayed" if replay.status == "sent" else "failed to replay"} to {target_url}',
        target_type='replay',
        target_id=str(replay.id),
        metadata={
            'event_id': str(event.id),
            'target_url': target_url,
            'status': replay.status,
            'response_code': replay.response_status_code,
        },
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        is_system=False
    )
    
    return Response({
        'message': 'Event replay initiated',
        'replay_id': str(replay.id),
        'status': replay.status
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def forward_event(request, event_id):
    """Forward a webhook event to a specified URL"""
    try:
        event = WebhookEvent.objects.get(
            id=event_id, 
            endpoint__user=request.user
        )
    except WebhookEvent.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    target_url = request.data.get('target_url')
    if not target_url:
        return Response({'error': 'target_url is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create forward record
    forward = WebhookForward.objects.create(
        event=event,
        target_url=target_url,
        status='pending'
    )
    
    # Send HTTP request to forward the event
    import requests
    try:
        # Prepare headers
        headers = {
            'Content-Type': event.content_type or 'application/json',
            'X-Webhook-Forward': 'true',
            'X-Original-Event-Id': str(event.id),
            'X-Event-Type': event.event_type,
            'X-Source-IP': event.source_ip or 'unknown',
            'User-Agent': 'WebhookPlatform/1.0',
        }
        
        # Add original headers if available
        if event.raw_headers:
            for key, value in event.raw_headers.items():
                if key.lower() not in ['host', 'content-length', 'authorization']:
                    headers[f'X-Original-{key}'] = value
        
        # Send the request
        response = requests.post(
            target_url,
            data=event.raw_body,
            headers=headers,
            timeout=30,
            allow_redirects=True
        )
        
        forward.status = 'sent'
        forward.response_status_code = response.status_code
        forward.response_body = response.text[:1000]  # Limit response body
        forward.forwarded_at = timezone.now()
        
    except requests.exceptions.RequestException as e:
        forward.status = 'failed'
        forward.error_message = f'Request failed: {str(e)}'
    except Exception as e:
        forward.status = 'failed'
        forward.error_message = f'Unexpected error: {str(e)}'
    
    forward.save()
    
    return Response({
        'message': 'Event forward initiated',
        'forward_id': str(forward.id),
        'status': forward.status
    }, status=status.HTTP_201_CREATED)
