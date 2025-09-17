# 🚀 WebHook Platform

A modern, professional webhook platform built with Django (backend) and React (frontend), featuring a beautiful dark mode, responsive design, and enterprise-grade webhook management capabilities.

## ✨ Features

### 🔐 **Authentication & User Management**
- Email-based authentication with secure JWT tokens
- User registration with email validation
- Password reset functionality with email verification
- Profile management with avatar support
- Remember me functionality for persistent sessions

### 📡 **Webhook Management**
- Create unlimited webhook endpoints with unique URLs
- Auto-generated signing secrets with HMAC SHA-256 verification
- Secret rotation with confirmation prompts
- Test webhook functionality with customizable payloads
- Real-time delivery tracking and event logging
- Status management (Active, Paused, Disabled)

### 📊 **Dashboard & Analytics**
- Modern dashboard with comprehensive statistics
- Real-time webhook activity monitoring
- Delivery success/failure tracking
- Event history with detailed logs
- Performance metrics and insights

### 🎨 **Modern UI/UX**
- Dark/Light mode with system preference detection
- Responsive design for mobile, tablet, and desktop
- Smooth animations with Framer Motion and GSAP
- Professional design with Tailwind CSS
- Collapsible sidebar for better workspace utilization
- Toast notifications for user feedback

## 🛠️ Technology Stack

### Backend
- Django 5.0.6 - Python web framework
- Django REST Framework 3.15.1 - API development
- Django REST Framework SimpleJWT 5.3.0 - JWT authentication
- Django CORS Headers 4.3.1 - CORS handling
- SQLite - Default database (easily configurable)

### Frontend
- React 19.1.1 - UI library
- React Router DOM 6.22.0 - Client-side routing
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- Framer Motion 11.0.0 - Smooth animations
- GSAP 3.12.0 - Advanced animations
- React Icons 5.0.0 - Beautiful icons
- React Hook Form 7.50.0 - Form management
- React Hot Toast 2.4.1 - Toast notifications
- Axios 1.6.0 - HTTP client

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ installed on your system
- Node.js 16+ and npm installed
- Git for version control

### 1. Backend Setup

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Set Environment Variables (Windows)
```bash
# Run the setup script
.\set_env.bat
```

#### For Linux/Mac, set these environment variables:
```bash
export DEBUG=True
export SECRET_KEY=your-secret-key-here
export WEBHOOK_SECRET_KEY=your-webhook-secret-key-here
export WEBHOOK_URL_BASE=http://localhost:8000
```

#### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser
```bash
python manage.py createsuperuser --email admin@example.com
```

#### Start Django Development Server
```bash
python manage.py runserver
```

The Django API will be available at `http://localhost:8000`

### 2. Frontend Setup

#### Install Node Dependencies
```bash
npm install
```

#### Start React Development Server
```bash
npm start
```

The React app will be available at `http://localhost:3000`

## 📖 Usage Guide

### 🔐 Authentication Flow

1. **Register** - Create a new account with email and password
2. **Email Verification** - Verify your email (development: check console)
3. **Login** - Sign in with your credentials
4. **Dashboard** - Access your webhook management dashboard

### 📡 Managing Webhooks

#### Creating a Webhook Endpoint
1. Click **"Create Webhook"** in the dashboard
2. Enter endpoint name and description
3. Choose initial status (Active/Paused/Disabled)
4. Click **"Create Endpoint"**

Your webhook URL will be: `http://localhost:8000/webhook/{unique-token}/`

#### Testing Your Webhook
1. Click **"Test"** on any webhook card
2. Choose a payload template or create custom JSON
3. Click **"Send Test"** to trigger the webhook
4. Check the delivery logs for results

#### Rotating Secrets
1. Click **"Rotate Secret"** on webhook card
2. Confirm the action in the modal
3. Update your webhook consumer with the new secret

### 🔒 Webhook Security

All webhooks include an `X-Signature` header with HMAC SHA-256 signature:

```python
# Python example for verifying webhook signature
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f'sha256={expected}', signature)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Django debug mode | `True` |
| `SECRET_KEY` | Django secret key | Required |
| `WEBHOOK_SECRET_KEY` | Webhook encryption key | Required |
| `WEBHOOK_URL_BASE` | Base URL for webhooks | `http://localhost:8000` |
| `REACT_APP_API_BASE_URL` | Frontend API URL | `http://localhost:8000/api` |

---

**Made with ❤️ by the WebHook Platform Team**

*Building the future of webhook management, one endpoint at a time.*
