# WebHook Platform - Project Structure

## Architecture Overview
Full-stack web application with Django REST API backend and React frontend, following a modular Django apps architecture with component-based React structure.

## Directory Structure

### Root Level
```
webpush/
├── apps/                    # Django applications (backend modules)
├── src/                     # React frontend source code
├── webpush/                 # Django project configuration
├── public/                  # Static frontend assets
├── manage.py               # Django management script
├── package.json            # Node.js dependencies and scripts
├── requirements.txt        # Python dependencies
└── README.md              # Project documentation
```

### Backend Structure (`apps/`)
```
apps/
├── authentication/         # User authentication and JWT management
│   ├── models.py          # Custom user model and managers
│   ├── serializers.py     # API serializers for auth endpoints
│   ├── views.py           # Authentication API views
│   └── urls.py            # Authentication URL routing
├── webhooks/              # Core webhook functionality
│   ├── models.py          # Webhook, Event, Forward, Replay models
│   ├── serializers.py     # Webhook API serializers
│   ├── views.py           # Webhook CRUD and management APIs
│   └── urls.py            # Webhook URL routing
└── core/                  # Shared utilities and WebSocket consumers
    ├── models.py          # Base models and utilities
    ├── consumers.py       # WebSocket consumers for real-time updates
    └── views.py           # Core API views and utilities
```

### Frontend Structure (`src/`)
```
src/
├── components/            # Reusable React components
│   ├── auth/             # Authentication forms and layouts
│   ├── layout/           # Dashboard layout, header, sidebar
│   ├── ui/               # Base UI components (Button, Input, etc.)
│   └── webhooks/         # Webhook-specific components
├── contexts/             # React Context providers
│   ├── AuthContext.js    # Authentication state management
│   └── ThemeContext.js   # Theme (dark/light mode) management
├── hooks/                # Custom React hooks
│   └── useWebSocket.js   # WebSocket connection management
├── pages/                # Route-level page components
│   ├── Dashboard.js      # Main dashboard with statistics
│   ├── Webhooks.js       # Webhook list and management
│   ├── WebhookDetail.js  # Individual webhook details
│   └── Auth pages        # Login, Register, ForgotPassword
├── services/             # API service layer
│   ├── api.js            # Base API configuration (Axios)
│   ├── auth.js           # Authentication API calls
│   ├── webhooks.js       # Webhook API calls
│   └── websocket.js      # WebSocket service
└── App.js                # Main application component with routing
```

### Configuration (`webpush/`)
```
webpush/
├── settings.py           # Django settings and configuration
├── urls.py               # Main URL routing
├── asgi.py               # ASGI configuration for WebSockets
├── routing.py            # WebSocket URL routing
└── wsgi.py               # WSGI configuration for HTTP
```

## Core Components & Relationships

### Backend Architecture
- **Django Apps Pattern**: Modular apps for authentication, webhooks, and core functionality
- **Django REST Framework**: API endpoints with serializers and viewsets
- **WebSocket Support**: Real-time updates via Django Channels
- **JWT Authentication**: Token-based auth with refresh token support

### Frontend Architecture
- **Component-Based**: Reusable UI components with clear separation of concerns
- **Context API**: Global state management for auth and theme
- **Service Layer**: Centralized API calls and WebSocket management
- **React Router**: Client-side routing with protected routes

### Data Flow
1. **Authentication**: JWT tokens stored in localStorage, managed by AuthContext
2. **API Communication**: Axios interceptors handle token refresh and error handling
3. **Real-Time Updates**: WebSocket connections for live webhook event notifications
4. **State Management**: React Context for global state, local state for component-specific data

## Key Architectural Patterns
- **Separation of Concerns**: Clear boundaries between frontend/backend, UI/business logic
- **RESTful API Design**: Standard HTTP methods and status codes
- **Component Composition**: Reusable UI components with props-based configuration
- **Service Layer Pattern**: Abstracted API calls in dedicated service modules
- **Real-Time Architecture**: WebSocket integration for live updates