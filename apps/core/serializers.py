from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    time_ago = serializers.ReadOnlyField()
    icon = serializers.ReadOnlyField()
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'actor', 'actor_name', 'type', 'title', 'description',
            'target_type', 'target_id', 'metadata', 'ip_address',
            'is_system', 'created_at', 'time_ago', 'icon'
        ]
    
    def get_actor_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.actor.title() if obj.actor else 'System'


class ActivityLogDetailSerializer(serializers.ModelSerializer):
    time_ago = serializers.ReadOnlyField()
    icon = serializers.ReadOnlyField()
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'actor', 'actor_name', 'type', 'title', 'description',
            'target_type', 'target_id', 'metadata', 'ip_address', 'user_agent',
            'is_system', 'created_at', 'time_ago', 'icon'
        ]
    
    def get_actor_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.actor.title() if obj.actor else 'System'
