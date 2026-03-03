# API Documentation - LinkBio Brasil

Documentação completa da API REST do LinkBio Brasil.

## 🔐 Autenticação

A API utiliza NextAuth.js para autenticação. A maioria dos endpoints requer autenticação via cookie de sessão.

### Cookies de Sessão

```
Cookie: next-auth.session-token=<token>
```

---

## 📡 Endpoints da API

### Autenticação

#### POST /api/auth/signup
Criar uma nova conta de usuário.

**Request:**
```json
{
  "name": "João Silva",
  "username": "joaosilva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Conta criada com sucesso"
}
```

**Error (400):**
```json
{
  "error": "Email já cadastrado"
}
```

---

### Links

#### GET /api/links
Listar todos os links do usuário autenticado.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

**Response (200):**
```json
{
  "links": [
    {
      "id": "clxxx",
      "title": "Meu Portfolio",
      "url": "https://meusite.com",
      "description": "Veja meus projetos",
      "icon": "🎨",
      "position": 1,
      "isActive": true,
      "clicks": 42
    }
  ]
}
```

#### POST /api/links
Criar um novo link.

**Headers:**
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Meu Portfolio",
  "url": "https://meusite.com",
  "description": "Veja meus projetos",
  "icon": "🎨"
}
```

**Response (201):**
```json
{
  "id": "clxxx",
  "title": "Meu Portfolio",
  "url": "https://meusite.com",
  "description": "Veja meus projetos",
  "icon": "🎨",
  "position": 1,
  "isActive": true,
  "clicks": 0
}
```

#### PATCH /api/links/[id]
Atualizar um link existente.

**Headers:**
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Novo Título",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "clxxx",
  "title": "Novo Título",
  "url": "https://meusite.com",
  "description": "Veja meus projetos",
  "icon": "🎨",
  "isActive": false,
  "clicks": 42
}
```

#### DELETE /api/links/[id]
Deletar um link.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Link deletado com sucesso"
}
```

---

### Perfil

#### GET /api/profile
Buscar perfil do usuário autenticado.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

**Response (200):**
```json
{
  "id": "clxxx",
  "name": "João Silva",
  "username": "joaosilva",
  "email": "joao@email.com",
  "image": "https://...",
  "bio": "Desenvolvedor Full Stack"
}
```

#### PATCH /api/profile
Atualizar perfil do usuário.

**Headers:**
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "João Silva Jr",
  "bio": "Desenvolvedor Full Stack apaixonado por React"
}
```

**Response (200):**
```json
{
  "id": "clxxx",
  "name": "João Silva Jr",
  "username": "joaosilva",
  "email": "joao@email.com",
  "image": "https://...",
  "bio": "Desenvolvedor Full Stack apaixonado por React"
}
```

---

### Avatar (Proposto)

#### POST /api/avatar
Fazer upload de avatar.

**Headers:**
```
Cookie: next-auth.session-token=<token>
Content-Type: multipart/form-data
```

**Request:**
```
avatar: <file>
```

**Response (200):**
```json
{
  "url": "/uploads/avatars/clxxx-avatar.jpg",
  "success": true
}
```

---

### Background (Proposto)

#### POST /api/background
Fazer upload de imagem de fundo.

**Headers:**
```
Cookie: next-auth.session-token=<token>
Content-Type: multipart/form-data
```

**Request:**
```
background: <file>
```

**Response (200):**
```json
{
  "url": "/uploads/backgrounds/clxxx-bg.jpg",
  "success": true
}
```

---

### QR Code (Proposto)

#### GET /api/qr/[username]
Gerar QR Code da página pública.

**Response (200):**
```
(Imagem PNG do QR Code)
```

---

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Permissão negada |
| 404 | Não encontrado |
| 500 | Erro interno do servidor |

---

## 🧪 Exemplos de Uso com cURL

### Criar Link
```bash
curl -X POST http://localhost:3000/api/links \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meu Portfolio",
    "url": "https://meusite.com",
    "description": "Veja meus projetos",
    "icon": "🎨"
  }'
```

### Atualizar Perfil
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Nova bio"
  }'
```

### Deletar Link
```bash
curl -X DELETE http://localhost:3000/api/links/clxxx \
  -H "Cookie: next-auth.session-token=<token>"
```

---

## 📝 Notas

- Todos os timestamps estão em UTC
- IDs são strings formatados em CUID
- Requisições sem autenticação retornam 401
- Rate limiting será implementado em versão futura
