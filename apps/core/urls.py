from django.urls import path
from .views import health_check, api_info, webhook_receiver, ActivityLogListView, ActivityLogDetailView

app_name = 'core'

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('info/', api_info, name='api_info'),
    path('activity/', ActivityLogListView.as_view(), name='activity-list'),
    path('activity/<uuid:pk>/', ActivityLogDetailView.as_view(), name='activity-detail'),
]
