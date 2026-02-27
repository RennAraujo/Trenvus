# Email Configuration

## SMTP Setup

To send real emails, configure the following environment variables:

### Required Variables

```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
APP_BASE_URL=https://yourdomain.com
```

### Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Use this password as `SMTP_PASSWORD`

### Example Docker Compose

```yaml
services:
  backend:
    environment:
      - SMTP_ENABLED=true
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USERNAME=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      - SMTP_FROM=noreply@trenvus.com
      - APP_BASE_URL=http://localhost:3000
```

### Without SMTP (Development)

If SMTP is not configured, emails will be logged to the console instead of being sent.

## Email Features

### Registration Verification
- User registers with email
- Verification email sent with token
- User clicks link to verify
- Account activated

### Email Change Verification
- User requests email change
- Verification email sent to NEW email
- User clicks link to verify
- Email updated in database
- Notification sent to OLD email

### Security Features
- Tokens expire after 24 hours
- Tokens are single-use
- Old tokens are invalidated when new ones are created
- Secure random token generation (32 bytes, Base64 URL-safe)
