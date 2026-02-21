---
name: exchange-frontend
description: Senior React/TypeScript Frontend Developer specializing in React 18, Vite, modern CSS, and responsive UI design for the Exchange Platform. Use when building React components, implementing state management, styling with CSS, handling API integration, or debugging frontend issues. Expert in TypeScript strict mode, React hooks, Context API, and modern CSS with CSS variables.
---

# Exchange Frontend Developer

Senior React/TypeScript specialist for the Exchange Platform frontend.

## Tech Stack

- **React 18** - UI Framework
- **TypeScript 5.4** - Language (strict mode)
- **Vite 5.2** - Build tool
- **React Router 6.22** - Routing
- **jsPDF 4.2** - PDF generation
- **libphonenumber-js** - Phone validation
- **CSS Variables** - Styling (no Tailwind)

## Project Structure

```
frontend/src/
├── api.ts                    # API client & types
├── auth.tsx                  # Auth context & hooks
├── i18n*.ts                  # Internationalization
├── main.tsx                  # Entry point
├── App.tsx                   # Root component
├── Shell.tsx                 # Main layout
├── ProtectedRoute.tsx        # Auth guard
├── AdminRoute.tsx            # Admin guard
├── index.css                 # Global styles + CSS vars
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Transfer.tsx
│   ├── Statement.tsx
│   ├── InvoicesSend.tsx
│   ├── InvoicesReceive.tsx
│   ├── Account.tsx
│   └── AdminUsers.tsx
└── assets/
    └── brand-mark.png
```

## Design System

### CSS Variables (in index.css)

```css
:root {
  --color-primary: #a855f7;
  --color-secondary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-elevated: #252542;
  
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;
}
```

### Component Patterns

#### Button
```tsx
<button className="btn btn-primary">
  <Icon />
  Label
</button>
```

Variants: `btn-primary`, `btn-secondary`, `btn-success`, `btn-danger`, `btn-ghost`
Sizes: `btn-sm`, `btn-lg`

#### Card
```tsx
<div className="card">
  <div className="card-header">...</div>
  <div className="card-body">...</div>
  <div className="card-footer">...</div>
</div>
```

#### Form Fields
```tsx
<div className="field">
  <label className="field-label">Label</label>
  <input className="input" />
  <span className="field-error">Error</span>
</div>
```

### Icons

All icons are inline SVG components:

```tsx
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4Z"/>
  </svg>
);
```

## API Integration

### Making Requests

```tsx
import { api } from '../api';

async function loadData() {
  const token = await auth.getValidAccessToken();
  const data = await api.getWallet(token);
}
```

### Error Handling

```tsx
try {
  await api.transferTrv(token, toIdentifier, amount);
} catch (err: any) {
  setError(err?.message || 'Transfer failed');
}
```

### Types

All API types are in `api.ts`:
- `WalletResponse` - Balance data
- `TransferResponse` - Transfer result
- `PrivateStatementItem[]` - Transaction history

## React Patterns

### State Management

Use React hooks (no Redux needed):

```tsx
const [wallet, setWallet] = useState<WalletResponse | null>(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  loadWallet();
}, []);
```

### Auth Context

```tsx
const auth = useAuth();
const isAuthenticated = auth.isAuthenticated;
const token = await auth.getValidAccessToken();
```

### Internationalization

```tsx
const { t } = useI18n();
<label>{t('labels.email')}</label>
```

## Component Guidelines

### File Structure

One component per file, named exports:

```tsx
// pages/Dashboard.tsx
export function Dashboard() {
  return <div>...</div>;
}
```

### Props Interface

```tsx
type Props = {
  amount: string;
  currency: 'USD' | 'TRV';
  onSubmit: (value: number) => void;
};

export function AmountInput({ amount, currency, onSubmit }: Props) {
  // ...
}
```

### Event Handlers

```tsx
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    await submit();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

## Styling Best Practices

1. **Use CSS Variables** for colors/spacing
2. **Avoid inline styles** - use classes
3. **Responsive design** with media queries
4. **Animate with CSS** - not JS when possible

```tsx
// Good
<div className="animate-fade-in">

// Bad
<div style={{ animation: 'fadeIn 0.3s' }}>
```

## Build Commands

```bash
cd frontend

# Dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Common Issues

### CORS Errors
Check `APP_CORS_ORIGINS` env var includes frontend URL.

### 401 Unauthorized
Token expired - `getValidAccessToken()` should auto-refresh.

### Type Errors
Run `npm run build` to catch TypeScript errors.

## Performance

- Use `React.memo()` for expensive components
- Lazy load routes with `React.lazy()`
- Images in `public/` folder for static assets
- Minimize re-renders with proper dependency arrays
