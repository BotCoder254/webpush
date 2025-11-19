# WebHook Platform - Technology Stack

## Programming Languages
- **Python 3.8+**: Backend development with Django
- **JavaScript (ES6+)**: Frontend development with React
- **HTML5/CSS3**: Markup and styling
- **SQL**: Database queries and migrations

## Backend Technologies

### Core Framework
- **Django 5.0.6**: Python web framework for rapid development
- **Django REST Framework 3.15.1**: API development with serializers and viewsets
- **Django Channels**: WebSocket support for real-time features
- **Daphne**: ASGI server for WebSocket and HTTP

### Authentication & Security
- **Django REST Framework SimpleJWT 5.3.0**: JWT token authentication
- **Django CORS Headers 4.3.1**: Cross-origin resource sharing
- **Cryptography**: Secure token generation and HMAC signatures
- **Django Allauth**: Extended authentication features

### Database & Caching
- **SQLite**: Default development database
- **PostgreSQL**: Production database support (psycopg2-binary)
- **Redis**: Caching and WebSocket channel layer
- **Django ORM**: Database abstraction and migrations

### Task Processing & Deployment
- **Celery**: Asynchronous task processing
- **Gunicorn**: WSGI HTTP server for production
- **Pillow**: Image processing for user avatars

## Frontend Technologies

### Core Framework
- **React 19.1.1**: Component-based UI library
- **React DOM 19.1.1**: DOM rendering for React
- **React Router DOM 6.22.0**: Client-side routing and navigation

### Styling & Animation
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Framer Motion 11.0.0**: Smooth animations and transitions
- **GSAP 3.12.0**: Advanced animations and effects

### UI Components & Icons
- **React Icons 5.0.0**: Comprehensive icon library
- **React Hook Form 7.50.0**: Form management and validation
- **React Hot Toast 2.4.1**: Toast notifications
- **Recharts 3.2.1**: Data visualization and charts

### Data & State Management
- **Axios 1.6.0**: HTTP client for API requests
- **JS Cookie 3.0.5**: Cookie management
- **React Context API**: Global state management

### Performance & Virtualization
- **React Window 2.1.0**: Efficient rendering of large lists
- **React Window Infinite Loader 2.0.0**: Infinite scrolling support

## Development Tools

### Testing
- **@testing-library/react 16.3.0**: React component testing
- **@testing-library/jest-dom 6.8.0**: Jest DOM matchers
- **@testing-library/user-event 13.5.0**: User interaction testing
- **Web Vitals 2.1.4**: Performance monitoring

### Build & Development
- **React Scripts 5.0.1**: Build tooling and development server
- **Create React App**: Project scaffolding and configuration
- **ESLint**: Code linting and style enforcement
- **Browserslist**: Browser compatibility configuration

## Development Commands

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser --email admin@example.com

# Run development server
python manage.py runserver

# Run with WebSocket support
python run_daphne.py
```

### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Environment Configuration

### Required Environment Variables
- `DEBUG`: Django debug mode (True/False)
- `SECRET_KEY`: Django secret key for cryptographic signing
- `WEBHOOK_SECRET_KEY`: Key for webhook signature generation
- `WEBHOOK_URL_BASE`: Base URL for webhook endpoints
- `REACT_APP_API_BASE_URL`: Frontend API base URL

### Development Ports
- **Django Backend**: http://localhost:8000
- **React Frontend**: http://localhost:3000
- **WebSocket**: ws://localhost:8000/ws/

## Database Schema
- **SQLite**: Development database (db.sqlite3)
- **Migrations**: Automated schema versioning
- **Models**: User, Webhook, WebhookEvent, WebhookForward, WebhookReplay

## API Architecture
- **RESTful Endpoints**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **JWT Authentication**: Bearer token in Authorization header
- **CORS Enabled**: Cross-origin requests from React frontend
- **WebSocket Integration**: Real-time event notifications