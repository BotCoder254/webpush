from django.db import models
from django.conf import settings
from django.utils import timezone
from cryptography.fernet import Fernet
import secrets
import uuid
import hashlib


class WebhookEndpoint(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('disabled', 'Disabled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='webhook_endpoints')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    path_token = models.CharField(max_length=64, unique=True, db_index=True)
    encrypted_secret = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'webhook_endpoints'
        verbose_name = 'Webhook Endpoint'
        verbose_name_plural = 'Webhook Endpoints'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"
    
    def save(self, *args, **kwargs):
        if not self.path_token:
            self.path_token = self.generate_path_token()
        if not self.encrypted_secret:
            self.encrypted_secret = self.encrypt_secret(self.generate_secret())
        super().save(*args, **kwargs)
    
    def generate_path_token(self):
        return secrets.token_urlsafe(32)
    
    def generate_secret(self):
        return secrets.token_urlsafe(32)
    
    def encrypt_secret(self, secret):
        import base64
        # Generate a proper 32-byte key for Fernet
        key_material = b'this_is_a_32_byte_key_for_Fernet'  # Exactly 32 bytes
        key = base64.urlsafe_b64encode(key_material)
        cipher = Fernet(key)
        return cipher.encrypt(secret.encode()).decode()
    
    def decrypt_secret(self):
        import base64
        # Generate a proper 32-byte key for Fernet
        key_material = b'this_is_a_32_byte_key_for_Fernet'  # Exactly 32 bytes
        key = base64.urlsafe_b64encode(key_material)
        cipher = Fernet(key)
        return cipher.decrypt(self.encrypted_secret.encode()).decode()
    
    def rotate_secret(self):
        new_secret = self.generate_secret()
        self.encrypted_secret = self.encrypt_secret(new_secret)
        self.save()
        return new_secret
    
    @property
    def webhook_url(self):
        return f"{settings.WEBHOOK_URL_BASE}/webhook/{self.path_token}/"
    
    @property
    def masked_secret(self):
        secret = self.decrypt_secret()
        return f"****{secret[-4:]}"


class WebhookDelivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endpoint = models.ForeignKey(WebhookEndpoint, on_delete=models.CASCADE, related_name='deliveries')
    headers = models.JSONField(default=dict)
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    delivery_attempts = models.IntegerField(default=0)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'webhook_deliveries'
        verbose_name = 'Webhook Delivery'
        verbose_name_plural = 'Webhook Deliveries'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Delivery {self.id} - {self.endpoint.name}"


class WebhookEvent(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
        ('forwarded', 'Forwarded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endpoint = models.ForeignKey(WebhookEndpoint, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=100)
    data = models.JSONField()
    raw_body = models.TextField(blank=True)  # Full raw body
    raw_headers = models.JSONField(default=dict)  # All headers
    signature = models.CharField(max_length=255, blank=True)
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    body_hash = models.CharField(max_length=64, blank=True)  # For deduplication
    request_id = models.CharField(max_length=255, blank=True, db_index=True)  # X-Request-Id
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    error_message = models.TextField(blank=True)
    body_size = models.PositiveIntegerField(default=0)
    is_duplicate = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'webhook_events'
        verbose_name = 'Webhook Event'
        verbose_name_plural = 'Webhook Events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['endpoint', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['body_hash']),
            models.Index(fields=['request_id']),
            models.Index(fields=['source_ip', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.endpoint.name}"
    
    @property
    def preview_body(self):
        """Return first 120 characters of the body for preview"""
        if self.raw_body:
            return self.raw_body[:120] + ('...' if len(self.raw_body) > 120 else '')
        return str(self.data)[:120] + ('...' if len(str(self.data)) > 120 else '')
    
    def save(self, *args, **kwargs):
        if self.raw_body and not self.body_hash:
            self.body_hash = hashlib.sha256(self.raw_body.encode()).hexdigest()
        if self.raw_body:
            self.body_size = len(self.raw_body.encode('utf-8'))
        super().save(*args, **kwargs)


class WebhookReplay(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_event = models.ForeignKey(WebhookEvent, on_delete=models.CASCADE, related_name='replays')
    target_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    replayed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'webhook_replays'
        verbose_name = 'Webhook Replay'
        verbose_name_plural = 'Webhook Replays'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Replay {self.id} - {self.original_event.event_type}"


class WebhookForward(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(WebhookEvent, on_delete=models.CASCADE, related_name='forwards')
    target_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    forwarded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'webhook_forwards'
        verbose_name = 'Webhook Forward'
        verbose_name_plural = 'Webhook Forwards'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Forward {self.id} - {self.event.event_type}"
