# API de Background

Endpoint para upload e gerenciamento de imagens de fundo da página.

## Endpoints

### POST /api/background

Fazer upload de uma imagem de fundo.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Auth: Obrigatório

**Body:**
```
background: <file> (image/jpeg, image/png, image/webp)
```

**Response (200):**
```json
{
  "url": "/uploads/backgrounds/clxxx-bg.jpg",
  "filename": "clxxx-bg.jpg",
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
- Tamanho máximo: 10MB
- Formatos: JPEG, PNG, WebP
- Dimensões recomendadas: 1920x1080px

## Implementação Pendente

Este endpoint ainda não está implementado. Para implementar:

1. Criar `app/api/background/route.js` ou `route.ts`
2. Configurar middleware de upload
3. Validar tipo e tamanho do arquivo
4. Salvar em `public/uploads/backgrounds/`
5. Atualizar o background do usuário no banco de dados
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
  const file = formData.get('background') as File;

  // Validação...
  // Upload...
  // Update database...

  return Response.json({ url: '/uploads/backgrounds/...', success: true });
}
```
