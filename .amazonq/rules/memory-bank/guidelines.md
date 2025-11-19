# WebHook Platform - Development Guidelines

## Code Quality Standards

### File Organization
- **Modular Structure**: Separate concerns into distinct modules (authentication, webhooks, core)
- **Component-Based Architecture**: React components organized by feature (auth/, layout/, ui/, webhooks/)
- **Service Layer Pattern**: Dedicated service modules for API calls and business logic
- **Clear Separation**: Frontend (src/) and backend (apps/) with distinct responsibilities

### Naming Conventions
- **React Components**: PascalCase for component names (WebhookDetail, AuthContext)
- **Files**: camelCase for JavaScript files, snake_case for Python files
- **Variables**: camelCase in JavaScript, snake_case in Python
- **Constants**: UPPER_SNAKE_CASE for action types and configuration
- **API Endpoints**: RESTful naming with clear resource identification

### Import Organization
- **React Imports**: React hooks first, then third-party libraries, then local imports
- **Django Imports**: Standard library, Django imports, third-party packages, local imports
- **Grouping**: Related imports grouped together with blank lines between groups
- **Absolute Paths**: Use absolute imports for services and components

## React Development Patterns

### State Management
- **useReducer Pattern**: Complex state logic managed with reducers (AuthContext)
- **Action Types**: Centralized action type constants for consistency
- **Context API**: Global state management for authentication and theme
- **Local State**: Component-specific state using useState for UI interactions

### Component Structure
```javascript
// Standard component structure pattern
const ComponentName = () => {
  // 1. Hooks and state
  const [state, setState] = useState(initialValue);
  const { contextValue } = useContext(SomeContext);
  
  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 3. Event handlers
  const handleEvent = async () => {
    // Event handling logic
  };
  
  // 4. Render logic
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};
```

### Error Handling
- **Try-Catch Blocks**: Comprehensive error handling in async functions
- **User Feedback**: Toast notifications for user-facing errors
- **Console Logging**: Detailed error logging for debugging
- **Graceful Degradation**: Fallback UI states for error conditions

### Loading States
- **Loading Indicators**: Consistent loading states across components
- **Skeleton Screens**: Loading placeholders for better UX
- **Disabled States**: Prevent multiple submissions during async operations
- **Progress Feedback**: Clear indication of ongoing operations

## Django Development Patterns

### ViewSet Structure
```python
class ModelViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # User-scoped querysets
        return Model.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        # Dynamic serializer selection
        if self.action == 'create':
            return CreateSerializer
        return DefaultSerializer
    
    @action(detail=True, methods=['post'])
    def custom_action(self, request, pk=None):
        # Custom endpoint actions
        pass
```

### Error Handling & Logging
- **Activity Logging**: Comprehensive audit trail for user actions
- **Exception Handling**: Proper exception catching with meaningful responses
- **Status Codes**: Appropriate HTTP status codes for different scenarios
- **Validation**: Input validation at serializer and view levels

### Security Practices
- **User Scoping**: All queries filtered by authenticated user
- **Permission Classes**: Consistent authentication requirements
- **Input Sanitization**: Proper validation of user inputs
- **Secret Management**: Encrypted storage of sensitive data

## API Design Patterns

### RESTful Conventions
- **Resource-Based URLs**: Clear resource identification in endpoints
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE
- **Nested Resources**: Logical nesting for related resources (endpoints/events)
- **Custom Actions**: @action decorator for non-CRUD operations

### Response Formats
```python
# Consistent response structure
{
    "message": "Operation successful",
    "data": {...},
    "status": "success"
}

# Error responses
{
    "error": "Error description",
    "details": {...},
    "status": "error"
}
```

### Pagination
- **Cursor Pagination**: For large datasets with consistent ordering
- **Page Size Limits**: Configurable page sizes with maximum limits
- **Metadata**: Include pagination metadata in responses

## Frontend Architecture Patterns

### Service Layer
```javascript
// Centralized API service pattern
const serviceModule = {
  async getResource(id) {
    try {
      const response = await api.get(`/resource/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Operation failed');
    }
  }
};
```

### Custom Hooks
- **Reusable Logic**: Extract common patterns into custom hooks
- **Event Cleanup**: Proper cleanup of event listeners and subscriptions
- **Dependency Arrays**: Careful management of useEffect dependencies
- **Callback Optimization**: Use useCallback for stable function references

### Animation & UI
- **Framer Motion**: Consistent animation patterns across components
- **Conditional Rendering**: Clean conditional UI rendering
- **Responsive Design**: Mobile-first responsive design patterns
- **Dark Mode**: Theme-aware styling with CSS custom properties

## Testing & Quality Assurance

### Code Organization
- **Single Responsibility**: Each function/component has one clear purpose
- **Pure Functions**: Prefer pure functions where possible
- **Immutable Updates**: Use immutable patterns for state updates
- **Type Safety**: Consistent prop validation and type checking

### Performance Optimization
- **Lazy Loading**: Dynamic imports for code splitting
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtualization**: React Window for large lists
- **Debouncing**: Debounced search and input handling

## Database & Backend Patterns

### Model Design
- **User Relationships**: Proper foreign key relationships to User model
- **Timestamps**: Consistent created_at/updated_at fields
- **Soft Deletes**: Logical deletion patterns where appropriate
- **Indexing**: Database indexes for frequently queried fields

### Query Optimization
- **Select Related**: Use select_related for foreign key relationships
- **Prefetch Related**: Optimize many-to-many and reverse foreign key queries
- **Filtering**: User-scoped filtering at the database level
- **Aggregation**: Database-level aggregations for analytics

## Security Guidelines

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Token Refresh**: Automatic token refresh patterns
- **Logout Handling**: Proper cleanup on logout
- **Session Management**: Secure session handling

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **HTTPS**: All communications over HTTPS in production
- **CORS**: Proper CORS configuration for cross-origin requests
- **Input Validation**: Comprehensive input validation and sanitization

## Development Workflow

### Code Style
- **Consistent Formatting**: Use consistent indentation and formatting
- **Meaningful Names**: Descriptive variable and function names
- **Comments**: Document complex logic and business rules
- **Documentation**: Keep README and documentation up to date

### Git Practices
- **Feature Branches**: Use feature branches for development
- **Commit Messages**: Clear, descriptive commit messages
- **Code Reviews**: Peer review before merging
- **Testing**: Test changes before committing