from django.contrib import admin
from .models import WebhookEndpoint, WebhookDelivery, WebhookEvent


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'status', 'created_at', 'last_used_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'user__email', 'path_token')
    readonly_fields = ('id', 'path_token', 'webhook_url', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('name', 'description', 'user', 'status')}),
        ('Webhook Details', {'fields': ('webhook_url', 'path_token', 'masked_secret')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_used_at')}),
    )


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'endpoint', 'status', 'response_status_code', 'delivery_attempts', 'created_at')
    list_filter = ('status', 'response_status_code', 'created_at')
    search_fields = ('endpoint__name', 'endpoint__user__email')
    readonly_fields = ('id', 'created_at')


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'endpoint', 'event_type', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('endpoint__name', 'endpoint__user__email', 'event_type')
    readonly_fields = ('id', 'created_at')
