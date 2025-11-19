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
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """Get events for this webhook endpoint"""
        endpoint = self.get_object()
        events = WebhookEvent.objects.filter(endpoint=endpoint).order_by('-created_at')
        
        # Apply pagination
        paginator = EventsCursorPagination()
        page = paginator.paginate_queryset(events, request)
        if page is not None:
            serializer = WebhookEventSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = WebhookEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """Get deliveries for this webhook endpoint"""
        endpoint = self.get_object()
        deliveries = WebhookDelivery.objects.filter(endpoint=endpoint).order_by('-created_at')
        
        # Apply pagination
        paginator = EventsCursorPagination()
        page = paginator.paginate_queryset(deliveries, request)
        if page is not None:
            serializer = WebhookDeliverySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = WebhookDeliverySerializer(deliveries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for this webhook endpoint"""
        endpoint = self.get_object()
        
        # Get date range from query params
        from django.utils import timezone
        from datetime import timedelta
        
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get events and deliveries within date range
        events = WebhookEvent.objects.filter(
            endpoint=endpoint,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        deliveries = WebhookDelivery.objects.filter(
            endpoint=endpoint,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Calculate analytics
        total_events = events.count()
        total_deliveries = deliveries.count()
        successful_deliveries = deliveries.filter(status='success').count()
        failed_deliveries = deliveries.filter(status='failed').count()
        
        # Events by day
        events_by_day = []
        for i in range(days):
            day_start = start_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_events = events.filter(created_at__gte=day_start, created_at__lt=day_end).count()
            day_successful = deliveries.filter(
                created_at__gte=day_start, 
                created_at__lt=day_end, 
                status='success'
            ).count()
            day_failed = deliveries.filter(
                created_at__gte=day_start, 
                created_at__lt=day_end, 
                status='failed'
            ).count()
            
            events_by_day.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'day_name': day_start.strftime('%a'),
                'events': day_events,
                'successful': day_successful,
                'failed': day_failed,
            })
        
        # Status distribution
        status_distribution = [
            {'status': 'Success', 'count': successful_deliveries},
            {'status': 'Failed', 'count': failed_deliveries},
        ]
        
        # Response time analytics (mock data for now)
        avg_response_time = 250  # milliseconds
        
        analytics_data = {
            'total_events': total_events,
            'total_deliveries': total_deliveries,
            'successful_deliveries': successful_deliveries,
            'failed_deliveries': failed_deliveries,
            'success_rate': (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
            'avg_response_time': avg_response_time,
            'events_by_day': events_by_day,
            'status_distribution': status_distribution,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days,
            }
        }
        
        return Response(analytics_data)

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
        
        import json
        import hmac
        import hashlib
        import requests
        from django.utils import timezone
        
        # Prepare payload
        payload_data = serializer.validated_data['payload']
        payload_json = json.dumps(payload_data)
        
        # Create HMAC signature
        secret = endpoint.decrypt_secret()
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_json.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'X-Signature': f'sha256={signature}',
            'X-Event-Type': serializer.validated_data['event_type'],
            'X-Webhook-Test': 'true',
            'X-Timestamp': str(int(timezone.now().timestamp())),
            'User-Agent': 'WebhookPlatform/1.0 (Test)',
        }
        
        # Create event record
        event = WebhookEvent.objects.create(
            endpoint=endpoint,
            event_type=serializer.validated_data['event_type'],
            data=payload_data,
            raw_body=payload_json,
            raw_headers=headers,
            signature=f'sha256={signature}',
            source_ip=request.META.get('REMOTE_ADDR', '127.0.0.1'),
            user_agent=headers['User-Agent'],
            content_type='application/json',
            status='processing'
        )
        
        # Create delivery record
        delivery = WebhookDelivery.objects.create(
            endpoint=endpoint,
            payload=payload_data,
            headers=headers,
            status='pending',
            delivery_attempts=1
        )
        
        # Actually send the webhook
        try:
            response = requests.post(
                endpoint.webhook_url,
                data=payload_json,
                headers=headers,
                timeout=30,
                allow_redirects=True
            )
            
            # Update delivery with response
            delivery.status = 'delivered' if response.status_code < 400 else 'failed'
            delivery.response_status_code = response.status_code
            delivery.response_body = response.text[:1000]  # Limit response body
            delivery.delivered_at = timezone.now()
            
            # Update event status
            event.status = 'processed' if response.status_code < 400 else 'failed'
            if response.status_code >= 400:
                event.error_message = f'HTTP {response.status_code}: {response.text[:200]}'
            
        except requests.exceptions.RequestException as e:
            # Handle request failures
            delivery.status = 'failed'
            delivery.response_status_code = 0
            delivery.response_body = f'Request failed: {str(e)}'
            
            event.status = 'failed'
            event.error_message = f'Request failed: {str(e)}'
        
        except Exception as e:
            # Handle unexpected errors
            delivery.status = 'failed'
            delivery.response_status_code = 0
            delivery.response_body = f'Unexpected error: {str(e)}'
            
            event.status = 'failed'
            event.error_message = f'Unexpected error: {str(e)}'
        
        # Save updates
        delivery.save()
        event.processed_at = timezone.now()
        event.save()
        
        # Update endpoint last used time
        endpoint.last_used_at = timezone.now()
        endpoint.save()
        
        # Log activity
        from apps.core.models import log_activity
        log_activity(
            user=request.user,
            actor=request.user.email if request.user else 'system',
            activity_type='WEBHOOK_TESTED',
            title=f'Webhook test sent to {endpoint.name}',
            description=f'Test webhook sent to "{endpoint.name}" with status: {delivery.status}',
            target_type='webhook',
            target_id=str(endpoint.id),
            metadata={
                'webhook_name': endpoint.name,
                'event_type': serializer.validated_data['event_type'],
                'delivery_status': delivery.status,
                'response_code': delivery.response_status_code,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            is_system=False
        )
        
        return Response({
            'message': 'Test webhook sent successfully',
            'event_id': str(event.id),
            'delivery_id': str(delivery.id),
            'status': delivery.status,
            'response_code': delivery.response_status_code
        }, status=status.HTTP_200_OK)
    



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
