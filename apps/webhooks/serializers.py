from rest_framework import serializers
from .models import WebhookEndpoint, WebhookDelivery, WebhookEvent, WebhookReplay, WebhookForward


class WebhookEndpointSerializer(serializers.ModelSerializer):
    webhook_url = serializers.ReadOnlyField()
    masked_secret = serializers.ReadOnlyField()
    deliveries_count = serializers.SerializerMethodField()
    events_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WebhookEndpoint
        fields = [
            'id', 'name', 'description', 'webhook_url', 'masked_secret',
            'status', 'created_at', 'updated_at', 'last_used_at',
            'deliveries_count', 'events_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_used_at']
    
    def get_deliveries_count(self, obj):
        return obj.deliveries.count()
    
    def get_events_count(self, obj):
        return obj.events.count()


class WebhookEndpointCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = ['name', 'description', 'status']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WebhookEndpointDetailSerializer(WebhookEndpointSerializer):
    recent_deliveries = serializers.SerializerMethodField()
    
    class Meta(WebhookEndpointSerializer.Meta):
        fields = WebhookEndpointSerializer.Meta.fields + ['recent_deliveries']
    
    def get_recent_deliveries(self, obj):
        recent = obj.deliveries.all()[:10]
        return WebhookDeliverySerializer(recent, many=True).data


class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'status', 'response_status_code', 'delivery_attempts',
            'delivered_at', 'created_at'
        ]


class WebhookEventSerializer(serializers.ModelSerializer):
    preview_body = serializers.ReadOnlyField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = WebhookEvent
        fields = [
            'id', 'event_type', 'data', 'raw_body', 'raw_headers', 'signature',
            'source_ip', 'user_agent', 'content_type', 'request_id', 'status',
            'error_message', 'body_size', 'is_duplicate', 'created_at',
            'processed_at', 'preview_body', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return f"{timesince(obj.created_at)} ago"


class WebhookReplaySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookReplay
        fields = [
            'id', 'target_url', 'status', 'response_status_code', 'response_body',
            'error_message', 'replayed_at', 'created_at'
        ]


class WebhookForwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookForward
        fields = [
            'id', 'target_url', 'status', 'response_status_code', 'response_body',
            'error_message', 'forwarded_at', 'created_at'
        ]


class WebhookEventDetailSerializer(serializers.ModelSerializer):
    endpoint_name = serializers.CharField(source='endpoint.name', read_only=True)
    endpoint_id = serializers.UUIDField(source='endpoint.id', read_only=True)
    time_ago = serializers.SerializerMethodField()
    replays = WebhookReplaySerializer(many=True, read_only=True)
    forwards = WebhookForwardSerializer(many=True, read_only=True)
    
    class Meta:
        model = WebhookEvent
        fields = [
            'id', 'endpoint_id', 'endpoint_name', 'event_type', 'data', 'raw_body', 
            'raw_headers', 'signature', 'source_ip', 'user_agent', 'content_type', 
            'request_id', 'status', 'error_message', 'body_size', 'is_duplicate', 
            'created_at', 'processed_at', 'time_ago', 'replays', 'forwards'
        ]
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return f"{timesince(obj.created_at)} ago"


class WebhookTestSerializer(serializers.Serializer):
    payload = serializers.JSONField()
    event_type = serializers.CharField(max_length=100, default='test')


class WebhookSecretRotateSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(default=False)
    
    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm secret rotation.")
        return value
