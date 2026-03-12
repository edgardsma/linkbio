> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# 🚀 Iniciando os Testes - LinkBio Brasil

## 📋 Pré-requisitos

Antes de iniciar os testes, verifique se você tem:

- [ ] Node.js instalado (v18 ou superior)
- [ ] npm ou yarn instalado
- [ ] PostgreSQL instalado (ou Prisma Dev configurado)
- [ ] Git instalado
- [ ] Uma conta no Stripe (para testes de pagamento)

---

## 🛠️ Passo 1: Configuração do Ambiente

### 1.1 Clone/Atualize o Repositório

```bash
cd C:\Projetos\linkbio-brasil
git pull origin main
```

### 1.2 Instale as Dependências

```bash
npm install
```

### 1.3 Configure as Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/linkbio"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
GITHUB_CLIENT_ID="seu-github-client-id"
GITHUB_CLIENT_SECRET="seu-github-client-secret"

# Stripe (para testes de pagamento)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

> 💡 **Dica**: Para testes, você pode usar chaves de teste do Stripe sem configurar OAuth.

---

## 🗄️ Passo 2: Configuração do Banco de Dados

### 2.1 Inicie o PostgreSQL (Prisma Dev)

Abra um terminal e execute:

```bash
npm run prisma:dev
```

Isso iniciará um PostgreSQL local na porta 51213.

### 2.2 Execute as Migrações

Em outro terminal:

```bash
npm run prisma:migrate
```

### 2.3 Semeie os Temas (Opcional)

Para popular o banco com os 20 temas predefinidos:

```bash
npm run seed:themes
```

---

## 🚀 Passo 3: Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: http://localhost:3000

> ⚠️ **Importante**: Mantenha este terminal aberto durante toda a fase de testes.

---

## 🧪 Passo 4: Execute os Testes Automatizados

### 4.1 Teste Completo

Execute todos os testes automatizados:

```bash
npm test
```

Isso executará:
- ✅ Teste de conexão com banco de dados
- ✅ Teste de migrations
- ✅ Teste de temas
- ✅ Teste de endpoints da API
- ✅ Teste de página pública
- ✅ Teste de performance

### 4.2 Testes Individuais

Para testar apenas componentes específicos:

```bash
# Testar apenas banco de dados
npm run test:db

# Testar apenas API endpoints
npm run test:api

# Testar apenas temas
npm run test:themes
```

### 4.3 Resultado Esperado

Se tudo estiver correto, você verá:

```
🧪 SUITE DE TESTES - LINKBIO BRASIL
════════════════════════════════════════════════════════════════

📊 Etapa 1: Conexão com Banco
📊 Testando conexão com o banco de dados...
✅ Conexão com banco: OK
   Total de usuários: X
   Total de links: Y

📊 Etapa 2: Migrations
📊 Testando migrations...
✅ Migrations sincronizadas

📊 Etapa 3: Temas
📊 Testando sistema de temas...
✅ Sistema de temas: OK
   Total de temas: 20
   Temas premium: 15
   Temas gratuitos: 5

[...]

════════════════════════════════════════════════════════════════
📊 RESUMO FINAL
   Total de Testes: 6
   Testes Passados: 6
   Taxa de Sucesso: 100.0%

🎉 TODOS OS TESTES PASSARAM!
🚀 O sistema está pronto para uso em produção!
```

---

## 📝 Passo 5: Testes Manuais

Após os testes automatizados, siga o checklist completo em `docs/TESTES.md`.

### Resumo do Checklist Principal:

#### 1. Autenticação
- [ ] Login com Google
- [ ] Login com GitHub
- [ ] Login com email/senha
- [ ] Cadastro de novo usuário
- [ ] Logout

#### 2. Dashboard
- [ ] Exibição da lista de links
- [ ] Adicionar novo link
- [ ] Editar link existente
- [ ] Excluir link
- [ ] Reordenar links (drag & drop)
- [ ] Visualizar analytics

#### 3. Perfil
- [ ] Editar nome, bio, cores
- [ ] Fazer upload de avatar
- [ ] Fazer upload de background
- [ ] Selecionar tema
- [ ] Cores customizadas

#### 4. Página Pública
- [ ] Renderização correta do perfil
- [ ] Exibição dos links
- [ ] Clique nos links e redirecionamento
- [ ] Contagem de cliques
- [ ] Temas aplicados
- [ ] Background com overlay

#### 5. Mobile Preview
- [ ] Visualização em formato mobile
- [ ] Responsividade correta
- [ ] Toggle mostrar/ocultar

#### 6. Pagamentos (opcional)
- [ ] Visualizar planos de preços
- [ ] Iniciar checkout
- [ ] Webhook do Stripe
- [ ] Portal de faturamento

---

## 🔍 Passo 6: Validação de Funcionalidades Específicas

### 6.1 QR Code

```bash
# Testar geração de QR Code
curl -X GET "http://localhost:3000/api/qr/testeadmin?size=256" --output qr-test.png
```

### 6.2 Analytics

```bash
# Testar endpoint de analytics
curl -X GET "http://localhost:3000/api/analytics" \
  -H "Cookie: next-auth.session-token=..."
```

### 6.3 Sitemap

```bash
# Testar sitemap
curl -X GET "http://localhost:3000/sitemap.xml"
```

### 6.4 Temas

```bash
# Listar todos os temas
curl -X GET "http://localhost:3000/api/themes"
```

---

## 🐛 Solução de Problemas

### Banco de Dados Não Conecta

```bash
# Verifique se Prisma Dev está rodando
npx prisma dev status

# Reinicie o PostgreSQL
npm run prisma:dev
```

### Erro de Migrations

```bash
# Resetar o banco de dados (⚠️ PERDE DADOS)
npx prisma migrate reset

# Ou criar nova migration
npm run prisma:migrate
```

### Server Não Inicia

```bash
# Limpar cache do Next.js
rm -rf .next
npm run dev
```

### Temas Não Aparecem

```bash
# Verifique se os temas foram seedados
curl -X POST http://localhost:3000/api/seed
```

---

## 📊 Relatório de Testes

Após concluir todos os testes, preencha o template em `docs/TESTES.md`:

```markdown
## 📋 Relatório de Testes

**Data**: DD/MM/AAAA
**Responsável**: [Seu Nome]

### Resultados Gerais
- Total de Testes: X
- Passaram: Y
- Falharam: Z
- Taxa de Sucesso: X%

### Detalhes dos Testes
[...]
```

---

## ✅ Checklist Antes de Produção

Antes de fazer deploy para produção, verifique:

- [ ] Todos os testes passaram
- [ ] Autenticação funcionando corretamente
- [ ] Upload de arquivos (avatar, background) funcionando
- [ ] Drag & drop de links funcionando
- [ ] Temas aplicando corretamente
- [ ] Pagamentos testados (se aplicável)
- [ ] Sitemap gerado corretamente
- [ ] Performance aceitável (< 500ms por requisição)
- [ ] Security headers configurados
- [ ] HTTPS habilitado (produção)
- [ ] Backup do banco de dados configurado

---

## 📚 Documentação Adicional

- **Guia Completo de Testes**: `docs/TESTES.md`
- **API Documentation**: `docs/API.md`
- **Deploy Guide**: `docs/DEPLOY.md`
- **Stripe Setup**: `docs/STRIPE_SETUP.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique `docs/TESTES.md` → Solução de Problemas
2. Consulte `docs/TROUBLESHOOTING.md`
3. Revise os logs do terminal
4. Abra uma issue no GitHub

---

**Boa sorte nos testes! 🚀**
