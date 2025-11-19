# 🌐 Webhook External Access Setup Guide

This guide helps you set up external access to your webhook endpoints for testing with services like GitHub, Stripe, etc.

## 🚀 Quick Setup with Ngrok (Recommended)

### 1. Install Ngrok

**Windows:**
```bash
# Download from https://ngrok.com/download
# Or use chocolatey
choco install ngrok
```

**macOS:**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
# Download from https://ngrok.com/download
# Or use snap
sudo snap install ngrok
```

### 2. Setup Ngrok Account

1. Sign up at https://ngrok.com (free account works)
2. Get your auth token from the dashboard
3. Configure ngrok:
```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

### 3. Start Your Django Server

```bash
python manage.py runserver
```

### 4. Start Ngrok Tunnel

**Option A: Use our setup script (Recommended)**
```bash
python setup_ngrok.py
```

**Option B: Manual setup**
```bash
ngrok http 8000
```

### 5. Get Your Public URL

After starting ngrok, you'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

Your webhook URL will be:
```
https://abc123.ngrok.io/webhook/YOUR_WEBHOOK_TOKEN/
```

## 🔧 GitHub Webhook Setup

### 1. Go to Your GitHub Repository
- Navigate to Settings → Webhooks
- Click "Add webhook"

### 2. Configure Webhook
- **Payload URL**: `https://your-ngrok-id.ngrok.io/webhook/YOUR_TOKEN/`
- **Content type**: `application/json`
- **Secret**: Use the signing secret from your webhook dashboard
- **Events**: Choose events you want to receive

### 3. Test the Webhook
- GitHub will send a ping event to test the connection
- Check your webhook dashboard for the received event

## 🛠️ Troubleshooting

### "Failed to connect to host" Error

**Possible causes and solutions:**

1. **Ngrok tunnel not running**
   - Make sure ngrok is running: `ngrok http 8000`
   - Check the ngrok dashboard at http://localhost:4040

2. **Django server not running**
   - Start Django: `python manage.py runserver`
   - Verify it's accessible at http://localhost:8000

3. **Wrong URL format**
   - Ensure URL ends with `/`: `https://abc123.ngrok.io/webhook/token/`
   - Don't use localhost URLs for external services

4. **Firewall/Network issues**
   - Check if your firewall blocks incoming connections
   - Try restarting ngrok tunnel

### Signature Verification Issues

1. **Check webhook secret**
   - Copy the exact secret from your webhook dashboard
   - Paste it in the GitHub webhook secret field

2. **Content-Type mismatch**
   - Ensure GitHub sends `application/json`
   - Check the webhook logs for content type

### Debugging Steps

1. **Check Django logs**
   ```bash
   python manage.py runserver --verbosity=2
   ```

2. **Check ngrok logs**
   - Visit http://localhost:4040 for ngrok dashboard
   - View request/response details

3. **Check webhook events**
   - Go to your webhook detail page
   - Check the "Recent Events" tab
   - Look for error messages

## 🔒 Security Notes

### For Development
- Ngrok tunnels are temporary and change on restart
- Don't use ngrok URLs in production
- Keep your ngrok auth token secure

### For Production
- Use a proper domain with SSL certificate
- Set up proper DNS records
- Use environment variables for secrets
- Enable signature verification

## 📋 Common Webhook URLs

### GitHub
```
https://your-ngrok-id.ngrok.io/webhook/YOUR_TOKEN/
```

### Stripe
```
https://your-ngrok-id.ngrok.io/webhook/YOUR_TOKEN/
```

### Discord
```
https://your-ngrok-id.ngrok.io/webhook/YOUR_TOKEN/
```

## 🆘 Need Help?

1. **Check the logs** - Django console and ngrok dashboard
2. **Verify the URL** - Make sure it's accessible from outside
3. **Test locally first** - Use the test webhook feature
4. **Check GitHub delivery logs** - GitHub shows delivery attempts

## 🎯 Pro Tips

1. **Use a consistent ngrok subdomain** (paid feature):
   ```bash
   ngrok http 8000 --subdomain=mywebhooks
   ```

2. **Keep ngrok running** - Don't close the terminal
3. **Update webhook URLs** - When ngrok restarts, update external services
4. **Monitor webhook events** - Use the dashboard to debug issues

---

**Happy webhook testing! 🚀**