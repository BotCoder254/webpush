"""
WebSocket consumers for real-time updates.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class EventsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the user from the query parameters or headers
        user = await self.get_user()
        
        if user and user.is_authenticated:
            self.user = user
            self.room_group_name = f'events_{user.id}'
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to events feed'
            }))
        else:
            # Reject connection for unauthenticated users
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', '')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'message': 'pong'
                }))
        except json.JSONDecodeError:
            pass

    async def new_event(self, event):
        # Send new event to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_event',
            'event': event['event']
        }))

    @database_sync_to_async
    def get_user(self):
        """Get user from token in query parameters or headers."""
        try:
            # Try to get token from query parameters
            query_string = self.scope['query_string'].decode()
            
            if 'token=' in query_string:
                token = query_string.split('token=')[-1].split('&')[0]
            else:
                # Try to get token from headers
                headers = dict(self.scope['headers'])
                auth_header = headers.get(b'authorization', b'').decode()
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                else:
                    return AnonymousUser()
            
            if token and token != 'undefined':
                # Validate JWT token
                access_token = AccessToken(token)
                from django.contrib.auth import get_user_model
                User = get_user_model()
                return User.objects.get(id=access_token['user_id'])
            else:
                return AnonymousUser()
        except (InvalidToken, TokenError, KeyError, IndexError, Exception):
            return AnonymousUser()
