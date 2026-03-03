# API de QR Code

Endpoint para geração de QR Codes das páginas públicas.

## Endpoints

### GET /api/qr/[username]

Gerar QR Code da página pública do usuário.

**Request:**
- Method: GET
- Auth: Opcional

**Query Params:**
- `size`: Tamanho do QR Code (padrão: 256)
- `errorCorrectionLevel`: Nível de correção de erro (L, M, Q, H)

**Response (200):**
- Content-Type: image/png
- Binary: Imagem PNG do QR Code

**Error (404):**
```json
{
  "error": "Usuário não encontrado"
}
```

## Exemplos de Uso

### Básico
```
GET /api/qr/joaosilva
```

### Com tamanho personalizado
```
GET /api/qr/joaosilva?size=512
```

### Com nível de correção alto
```
GET /api/qr/joaosilva?errorCorrectionLevel=H
```

## Implementação Pendente

Para implementar:

1. Criar `app/api/qr/[username]/route.js` ou `route.ts`
2. Usar biblioteca `qrcode` já instalada
3. Gerar QR Code apontando para `https://dominio.com/[username]`
4. Retornar como buffer PNG

## Exemplo de Código

```typescript
import QRCode from 'qrcode';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const { searchParams } = new URL(request.url);

  const size = parseInt(searchParams.get('size') || '256');
  const errorCorrectionLevel = searchParams.get('errorCorrectionLevel') || 'M';

  // Verificar se usuário existe
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Gerar QR Code
  const url = `${process.env.NEXTAUTH_URL}/${username}`;
  const qr = await QRCode.toBuffer(url, {
    width: size,
    errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
  });

  return new Response(qr, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

## Use Cases

- **Link na Bio do Instagram**: Usuário coloca QR Code na bio
- **Cartão de Visita**: QR Code impresso para scan rápido
- **Material Promocional**: QR Code em flyers e banners
- **Eventos**: QR Code em telas para acesso rápido
