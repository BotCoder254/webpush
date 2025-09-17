from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WebhookEndpointViewSet,
    WebhookDeliveryDetailView,
    WebhookEventDetailView,
    WebhookEventListView,
    replay_event,
    forward_event
)

app_name = 'webhooks'

router = DefaultRouter()
router.register(r'endpoints', WebhookEndpointViewSet, basename='endpoint')

urlpatterns = [
    path('', include(router.urls)),
    path('deliveries/<uuid:pk>/', WebhookDeliveryDetailView.as_view(), name='delivery-detail'),
    path('events/', WebhookEventListView.as_view(), name='event-list'),
    path('events/<uuid:pk>/', WebhookEventDetailView.as_view(), name='event-detail'),
    path('events/<uuid:event_id>/replay/', replay_event, name='event-replay'),
    path('events/<uuid:event_id>/forward/', forward_event, name='event-forward'),
]
