"""
URL configuration for webpush project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import webhook_receiver, webhook_debug

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/webhooks/', include('apps.webhooks.urls')),
    path('api/', include('apps.core.urls')),
    path('webhook/<str:path_token>/', webhook_receiver, name='webhook_receiver'),
    path('debug/webhook/<str:path_token>/', webhook_debug, name='webhook_debug'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
