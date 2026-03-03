# API de Avatar

Endpoint para upload e gerenciamento de avatares do usuário.

## Endpoints

### POST /api/avatar

Fazer upload de um avatar.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Auth: Obrigatório

**Body:**
```
avatar: <file> (image/jpeg, image/png, image/webp)
```

**Response (200):**
```json
{
  "url": "/uploads/avatars/clxxx-avatar.jpg",
  "filename": "clxxx-avatar.jpg",
  "success": true
}
```

**Error (400):**
```json
{
  "error": "Arquivo inválido"
}
```

**Limitações:**
- Tamanho máximo: 5MB
- Formatos: JPEG, PNG, WebP
- Dimensões recomendadas: 200x200px

## Implementação Pendente

Este endpoint ainda não está implementado. Para implementar:

1. Criar `app/api/avatar/route.js` ou `route.ts`
2. Configurar middleware de upload (multer ou form-data)
3. Validar tipo e tamanho do arquivo
4. Salvar em `public/uploads/avatars/`
5. Atualizar o avatar do usuário no banco de dados
6. Retornar URL pública

## Exemplo de Código

```typescript
import { writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar') as File;

  // Validação...
  // Upload...
  // Update database...

  return Response.json({ url: '/uploads/avatars/...', success: true });
}
```
