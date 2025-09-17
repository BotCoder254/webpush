from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('WEBHOOK_RECEIVED', 'Webhook Received'),
        ('WEBHOOK_CREATED', 'Webhook Created'),
        ('WEBHOOK_UPDATED', 'Webhook Updated'),
        ('WEBHOOK_DELETED', 'Webhook Deleted'),
        ('SECRET_ROTATED', 'Secret Rotated'),
        ('REPLAY_TRIGGERED', 'Replay Triggered'),
        ('REPLAY_SUCCESS', 'Replay Success'),
        ('REPLAY_FAILED', 'Replay Failed'),
        ('FORWARD_TRIGGERED', 'Forward Triggered'),
        ('FORWARD_SUCCESS', 'Forward Success'),
        ('FORWARD_FAILED', 'Forward Failed'),
        ('LOGIN_SUCCESS', 'Login Success'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('LOGOUT', 'Logout'),
        ('API_KEY_CREATED', 'API Key Created'),
        ('API_KEY_DELETED', 'API Key Deleted'),
        ('USER_REGISTERED', 'User Registered'),
        ('PASSWORD_CHANGED', 'Password Changed'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('SYSTEM_ERROR', 'System Error'),
    ]

    TARGET_TYPES = [
        ('webhook', 'Webhook'),
        ('event', 'Event'),
        ('user', 'User'),
        ('replay', 'Replay'),
        ('forward', 'Forward'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='activity_logs',
        null=True,
        blank=True
    )
    actor = models.CharField(max_length=100, default='system')  # 'user' or 'system' or specific user ID
    type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_type = models.CharField(max_length=50, choices=TARGET_TYPES, null=True, blank=True)
    target_id = models.CharField(max_length=255, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'activity_logs'
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['type', '-created_at']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['is_system', '-created_at']),
        ]

    def __str__(self):
        return f"{self.type} - {self.title}"

    @property
    def time_ago(self):
        from django.utils.timesince import timesince
        return f"{timesince(self.created_at)} ago"

    @property
    def icon(self):
        """Return appropriate icon for the activity type"""
        icon_map = {
            'WEBHOOK_RECEIVED': '📩',
            'WEBHOOK_CREATED': '➕',
            'WEBHOOK_UPDATED': '✏️',
            'WEBHOOK_DELETED': '🗑️',
            'SECRET_ROTATED': '🔑',
            'REPLAY_TRIGGERED': '🔄',
            'REPLAY_SUCCESS': '✅',
            'REPLAY_FAILED': '❌',
            'FORWARD_TRIGGERED': '📤',
            'FORWARD_SUCCESS': '✅',
            'FORWARD_FAILED': '❌',
            'LOGIN_SUCCESS': '🔐',
            'LOGIN_FAILED': '🚫',
            'LOGOUT': '👋',
            'API_KEY_CREATED': '🔗',
            'API_KEY_DELETED': '🔓',
            'USER_REGISTERED': '👤',
            'PASSWORD_CHANGED': '🔒',
            'PASSWORD_RESET': '🔄',
            'SYSTEM_ERROR': '⚠️',
        }
        return icon_map.get(self.type, '📝')


def log_activity(user=None, actor='system', activity_type='SYSTEM_ERROR', title='', 
                description='', target_type=None, target_id=None, metadata=None, 
                ip_address=None, user_agent='', is_system=False):
    """
    Utility function to log activities
    """
    return ActivityLog.objects.create(
        user=user,
        actor=actor,
        type=activity_type,
        title=title,
        description=description,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
        is_system=is_system
    )