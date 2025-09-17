"""
WebSocket URL routing for webpush project.
"""

from django.urls import path
from apps.core.consumers import EventsConsumer

websocket_urlpatterns = [
    path('ws/events/', EventsConsumer.as_asgi()),
]
