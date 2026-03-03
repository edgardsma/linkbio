# Tipos TypeScript - LinkBio Brasil

Este diretório contém as definições de tipos TypeScript usadas em todo o projeto.

## Estrutura

```
types/
├── index.ts        # Tipos principais e exportações
├── api.ts          # Tipos específicos da API (futuro)
├── db.ts           # Tipos do banco de dados (futuro)
└── ui.ts           # Tipos de componentes UI (futuro)
```

## Principais Tipos

### User
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  // ...
}
```

### Link
```typescript
interface Link {
  id: string;
  title: string;
  url: string;
  position: number;
  // ...
}
```

### Subscription
```typescript
type Plan = 'free' | 'starter' | 'pro' | 'premium';
type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';
```

## Como Usar

```typescript
import { User, Link, LinkDTO } from '@/types';

// TypeScript irá inferir os tipos automaticamente
const user: User = { /* ... */ };
```

## Próximos Passos

- Criar tipos específicos para API
- Criar tipos para componentes UI
- Criar tipos para validação de formulários
