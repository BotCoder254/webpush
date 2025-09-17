# 🔍 Webhook Data Inspection Guide

This guide shows you how to view and inspect webhook data using Postman and your application.

## 📋 **Methods to View Webhook Data**

### **Method 1: Using the Debug Endpoint (Easiest)**

**URL**: `http://localhost:8000/debug/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/`

**In Postman:**
1. **Method**: `GET`
2. **URL**: `http://localhost:8000/debug/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/`
3. **Headers**: None required
4. **Send**: Click Send

**Response includes:**
- ✅ **Endpoint Details**: Name, URL, secret, creation date
- ✅ **Recent Events**: Last 10 webhook events with full data
- ✅ **Event Details**: Raw body, headers, signature, status, timestamps
- ✅ **Total Count**: Number of events received

### **Method 2: Using the HMAC Calculator Tool**

**File**: `webhook_test_tool.html`

1. **Open** the file in your browser
2. **View the test payload** in the JSON textarea
3. **Modify the payload** to test different data
4. **Copy the generated signature** for Postman testing

### **Method 3: View in Your Application UI**

1. **Login** to your webhook platform
2. **Go to Events page** to see all received webhook events
3. **Click on any event** to view detailed information
4. **Use filters** to find specific events

### **Method 4: Using Postman Console**

**In Postman:**
1. **Send your webhook request**
2. **Go to Console** (View → Show Postman Console)
3. **View the request details** including headers and body
4. **Check the response** for success/error messages

## 🧪 **Testing Different Webhook Data**

### **Test 1: Basic Webhook**
```json
{
  "event": "user.created",
  "data": {
    "user_id": 123,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### **Test 2: E-commerce Order**
```json
{
  "event": "order.completed",
  "data": {
    "order_id": "ORD-12345",
    "customer": {
      "id": 456,
      "email": "customer@example.com"
    },
    "items": [
      {
        "product_id": "PROD-001",
        "name": "Laptop",
        "price": 999.99,
        "quantity": 1
      }
    ],
    "total": 999.99,
    "currency": "USD"
  }
}
```

### **Test 3: Payment Event**
```json
{
  "event": "payment.processed",
  "data": {
    "payment_id": "PAY-789",
    "amount": 150.00,
    "currency": "USD",
    "status": "completed",
    "method": "credit_card",
    "customer_id": 123
  },
  "metadata": {
    "processor": "stripe",
    "transaction_id": "txn_1234567890"
  }
}
```

## 🔧 **Postman Collection Setup**

### **Request 1: Send Webhook**
- **Method**: `POST`
- **URL**: `http://localhost:8000/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/`
- **Headers**:
  ```
  Content-Type: application/json
  X-Signature: sha256=<calculated_signature>
  User-Agent: PostmanTest/1.0
  X-Request-Id: test-{{$timestamp}}
  ```
- **Body**: Use any of the test payloads above

### **Request 2: View Webhook Data**
- **Method**: `GET`
- **URL**: `http://localhost:8000/debug/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/`
- **Headers**: None required

### **Request 3: View All Events (API)**
- **Method**: `GET`
- **URL**: `http://localhost:8000/api/webhooks/events/`
- **Headers**:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

## 📊 **Understanding the Response Data**

### **Debug Endpoint Response Structure:**
```json
{
  "endpoint": {
    "name": "Test Webhook",
    "path_token": "IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY",
    "url": "http://localhost:8000/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/",
    "secret": "r_2GfX5HY7z88zebVejNU5BpYTGySrkmZT505ZFLSVc",
    "created_at": "2024-01-20T10:00:00Z",
    "last_used_at": "2024-01-20T16:30:00Z"
  },
  "recent_events": [
    {
      "id": "event-uuid",
      "event_type": "test.webhook",
      "data": { /* your webhook payload */ },
      "raw_body": "raw JSON string",
      "raw_headers": { /* all headers received */ },
      "source_ip": "127.0.0.1",
      "user_agent": "PostmanTest/1.0",
      "content_type": "application/json",
      "signature": "sha256=...",
      "status": "processed",
      "error_message": "",
      "created_at": "2024-01-20T16:30:00Z",
      "is_duplicate": false
    }
  ],
  "total_events": 5
}
```

## 🚀 **Quick Start Commands**

### **1. View Webhook Data:**
```bash
curl http://localhost:8000/debug/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/
```

### **2. Send Test Webhook:**
```bash
curl -X POST http://localhost:8000/webhook/IGIi3LsaTcS3GIDMNsX7NmrwJpDgXhXC3WsVG9rK3zY/ \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=<calculated_signature>" \
  -d '{"event": "test", "data": {"message": "Hello World"}}'
```

## 💡 **Pro Tips**

1. **Use the debug endpoint** to see all received webhook data
2. **Check the Events page** in your app for a visual interface
3. **Use different test payloads** to test various scenarios
4. **Monitor the console** for real-time webhook events
5. **Check signature verification** using the HMAC calculator tool

## 🔍 **Troubleshooting**

- **No events showing?** Make sure you've sent a webhook request first
- **Signature errors?** Use the HMAC calculator tool to generate correct signatures
- **Connection issues?** Check that Django server is running on port 8000
- **Empty response?** Verify the webhook path token is correct
