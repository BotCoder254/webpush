from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_email', 'actor', 'type', 'title',
            'description', 'target_type', 'target_id', 'metadata',
            'ip_address', 'user_agent', 'is_system', 'created_at', 'time_ago'
        ]
        read_only_fields = fields
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return f"{timesince(obj.created_at)} ago"


class ActivityLogDetailSerializer(ActivityLogSerializer):
    # Inherits all fields from ActivityLogSerializer
    # Can add more detailed fields if needed for a single activity view
    pass
