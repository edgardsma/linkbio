# API de Integrações

Endpoints para integração com redes sociais e plataformas terceiras.

## Endpoints Propostos

### POST /api/integrations/connect

Conectar uma conta de terceira parte (Google, GitHub, etc.).

**Request:**
- Method: POST
- Content-Type: application/json
- Auth: Obrigatório

**Body:**
```json
{
  "provider": "google",
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Response (200):**
```json
{
  "provider": "google",
  "providerAccountId": "123456789",
  "connectedAt": "2024-03-03T00:00:00Z"
}
```

### GET /api/integrations

Listar integrações conectadas do usuário.

**Request:**
- Method: GET
- Auth: Obrigatório

**Response (200):**
```json
{
  "integrations": [
    {
      "provider": "google",
      "providerAccountId": "123456789",
      "connectedAt": "2024-03-03T00:00:00Z"
    },
    {
      "provider": "github",
      "providerAccountId": "987654321",
      "connectedAt": "2024-03-03T00:00:00Z"
    }
  ]
}
```

### DELETE /api/integrations/[provider]

Desconectar uma integração.

**Request:**
- Method: DELETE
- Auth: Obrigatório

**Response (200):**
```json
{
  "success": true,
  "message": "Integração removida"
}
```

## Provedores Planejados

| Provedor | Status | Funcionalidades |
|----------|--------|----------------|
| Google | 🔵 OAuth | Login, Contatos, Calendar |
| GitHub | 🔵 OAuth | Login, Repositórios |
| Twitter/X | ⚪ Planejado | Login, Tweet |
| Instagram | ⚪ Planejado | Login, Mídia |
| LinkedIn | ⚪ Planejado | Login, Perfil |

## Implementação Pendente

Para implementar as integrações:

1. Criar modelo `Integration` no Prisma
2. Configurar OAuth providers no NextAuth
3. Criar endpoints para gerenciar conexões
4. Implementar funcionalidades específicas de cada provedor
5. Armazenar tokens de acesso e refresh de forma segura

## Modelo de Dados Proposto

```prisma
model Integration {
  id               String   @id @default(cuid())
  provider         String   // google, github, twitter
  providerAccountId String
  accessToken      String?
  refreshToken     String?
  tokenExpiresAt   DateTime?
  scopes           String[] // Permissions do OAuth
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  userId           String
  user             User     @relation(fields: [userId], references: [id])

  @@unique([userId, provider])
}
```

## Casos de Uso

### Importar Links do Instagram
```javascript
// GET /api/integrations/instagram/links
// Retorna: posts e stories do Instagram como links
```

### Compartilhar no Twitter
```javascript
// POST /api/integrations/twitter/share
// Body: { text: "Confira meus links em linkbio.com/username" }
```

### Sync de Avatar do Google
```javascript
// POST /api/integrations/google/sync-avatar
// Atualiza avatar do usuário com foto do Google
```

## Considerações de Segurança

1. Criptografar tokens de acesso no banco
2. Usar HTTPS em todas as requisições
3. Validar escopos de permissão
4. Implementar revogação de tokens
5. Rotacionar tokens periodicamente
