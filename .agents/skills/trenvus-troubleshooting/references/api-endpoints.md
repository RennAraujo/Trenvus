# API Endpoints Reference

## Authentication

### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user1@test.com",
  "password": "123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "accessExpiresAt": "2024-01-01T12:00:00Z",
  "refreshToken": "dGhpcyBpcyBh...",
  "tokenType": "Bearer"
}
```

### POST `/auth/register-initiate`
Start registration (email verification required).

**Request:**
```json
{
  "email": "newuser@test.com",
  "password": "password123",
  "nickname": "newuser"
}
```

### POST `/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

### POST `/auth/revoke`
Logout (blacklist token).

**Headers:** `Authorization: Bearer <token>`

## Wallet

### GET `/wallet`
Get current wallet balance.

**Response:**
```json
{
  "usdCents": 10000,
  "trvCents": 5000
}
```

### POST `/wallet/deposit`
Add funds (admin/testing only).

**Request:**
```json
{
  "amountUsd": "100.00"
}
```

## Transfer

### POST `/transfer`
Send money to another user.

**Request:**
```json
{
  "recipientEmail": "user2@test.com",
  "amount": "50.00",
  "currency": "USD",
  "idempotencyKey": "uuid-v4-here"
}
```

## Exchange (Convert)

### POST `/exchange/usd-to-trv`
Convert USD to TRV.

**Request:**
```json
{
  "amountUsd": "100.00",
  "idempotencyKey": "uuid-v4-here"
}
```

### POST `/exchange/trv-to-usd`
Convert TRV to USD.

**Request:**
```json
{
  "amountTrv": "100.00",
  "idempotencyKey": "uuid-v4-here"
}
```

## Transactions (Statement)

### GET `/transactions?page=0&size=20`
Get transaction history.

**Response:**
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 5,
  "hasNext": true
}
```

### POST `/transactions/send-statement-email`
Email statement PDF.

**Request:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "email": "user@test.com"
}
```

## Market

### GET `/market/crypto`
Get crypto prices.

### GET `/market/fiat`
Get fiat exchange rates.

### GET `/market/chart?symbol=BTC&interval=1h`
Get chart data for symbol.

## Invoices

### GET `/invoices/qr?amount=50.00&currency=USD&description=Payment`
Generate invoice QR code.

**Response:**
```json
{
  "qrPayload": "base64-encoded-data",
  "qrCodeId": "uuid",
  "amount": "50.00",
  "currency": "USD",
  "recipientEmail": "user@test.com",
  "recipientNickname": "user"
}
```

### POST `/invoices/pay`
Pay an invoice.

**Request:**
```json
{
  "qrPayload": "base64-encoded-data"
}
```

## Vouchers

### POST `/vouchers`
Create a voucher.

**Response:**
```json
{
  "code": "ABC123",
  "createdAt": "2024-01-01T12:00:00Z",
  "expiresAt": null,
  "viewUrl": "http://localhost:3000/voucher/view/ABC123"
}
```

### GET `/vouchers/{code}`
View voucher profile (public).

## User Profile

### GET `/me`
Get current user info.

**Response:**
```json
{
  "email": "user@test.com",
  "nickname": "user",
  "phone": null,
  "avatarDataUrl": null
}
```

### POST `/me/delete`
Delete account and all data.

## Admin

### GET `/admin/users`
List all users (admin only).

### GET `/admin/statements`
Get all transactions (admin only).

### GET `/admin/fees`
Get fee income (admin only).

## Mercado Pago

### POST `/mercadopago/create-preference`
Create payment preference.

**Request:**
```json
{
  "amount": 100.00
}
```

**Response:**
```json
{
  "preferenceId": "123456789",
  "initPoint": "https://...",
  "sandboxInitPoint": "https://..."
}
```
