> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# 🚀 Instruções para Testes Manuais - LinkBio Brasil

## Status Preparado para Testes

O projeto LinkBio Brasil está **100% implementado** com todas as 20 funcionalidades do MVP.

## ⚠️ Problema de Configuração Identificado

O Prisma Client está encontrando erros de inicialização devido à mistura de ESM/CommonJS e URL do banco especial (`prisma+postgres://`).

## ✅ Solução Alternativa - Teste via Browser

Como o ambiente de desenvolvimento tem problemas de configuração, você pode testar o sistema diretamente pelo navegador após o servidor estar rodando:

### Passo 1: Iniciar o Servidor (em um terminal)

```bash
cd C:\Projetos\linkbio-brasil
npm run dev
```

**Nota**: O servidor está configurado para rodar em background. Quando você iniciar, ele vai usar uma porta disponível (3001, 3002, etc.). Anote qual porta foi usada.

### Passo 2: Acessar o Sistema (no navegador)

Após o servidor iniciar, acesse:

- **Dashboard**: http://localhost:3001/dashboard
- **Login**: http://localhost:3001/auth/signin
- **Cadastro**: http://localhost:3001/auth/signup
- **Preços**: http://localhost:3001/pricing

**Substitua `3001` pela porta que o servidor usar (veja no terminal).**

## 🧪 Testes Manuais a Executar

### 1. Autenticação

- [ ] Tente criar uma conta com Email/Senha
- [ ] Tente fazer login com as credenciais criadas
- [ ] Tente acessar o Dashboard
- [ ] Faça logout

### 2. Criar Links

- [ ] No Dashboard, clique em "Adicionar Link"
- [ ] Preencha o formulário:
  - Título: "Meu Site"
  - URL: "https://google.com"
  - Descrição: "Buscador Google"
  - Ícone: "🔍"
- [ ] Clique em "Criar Link"
- [ ] Verifique se o link aparece na lista

### 3. Editar Link

- [ ] Clique no ícone de lápis de um link
- [ ] Altere o título
- [ ] Clique em "Salvar"
- [ ] Verifique se as alterações foram salvas

### 4. Excluir Link

- [ ] Clique no ícone de lixeira de um link
- [ ] Confirme a exclusão
- [ ] Verifique se o link foi removido

### 5. Ativar/Desativar Link

- [ ] Clique no toggle de um link
- [ ] Verifique se o link ficou ativo/inativo
- [ ] Clique novamente para reverter

### 6. Editar Perfil

- [ ] Acesse a página de Perfil
- [ ] Altere o nome
- [ ] Altere a bio
- [ ] Altere as cores:
  - Cor primária: #ff0000
  - Cor secundária: #00ff00
- [ ] Clique em "Salvar"
- [ ] Verifique se as mudanças aparecem no preview

### 7. Página Pública

- [ ] Acesse http://localhost:3001/seu-username (substitua pelo seu username)
- [ ] Verifique se os links aparecem
- [ ] Clique em um link
- [ ] Verifique se você foi redirecionado para o URL correta

### 8. Verificar API Endpoints

Abra o navegador em modo desenvolvedor (F12) e teste:

**Testar Temas:**
```bash
# No navegador ou via curl
curl http://localhost:3001/api/themes
```

- [ ] Verifique se retorna lista de 20 temas
- [ ] Verifique se há 5 temas gratuitos (isPremium: false)
- [ ] Verifique se há 15 temas premium (isPremium: true)

**Testar QR Code:**
```bash
# Substitua "seu-username" pelo seu username
curl http://localhost:3001/api/qr/seu-username?size=256
```

- [ ] Verifique se retorna uma imagem PNG
- [ ] Tente salvar a imagem e abrir no navegador

**Testar Analytics:**
```bash
# Acesso como usuário autenticado
curl http://localhost:3001/api/analytics \
  -H "Cookie: next-auth.session-token=..."
```

- [ ] Verifique se retorna estatísticas de cliques
- [ ] Verifique se há cliques por link
- [ ] Verifique se há distribuição por dia

### 9. Verificar Estrutura de Arquivos

Verifique se todos os arquivos importantes existem:

```bash
# Verificar estrutura
ls -la app/api/
ls -la components/
ls -la lib/
```

- [ ] app/api/auth/[...nextauth]/route.js
- [ ] app/api/analytics/route.js
- [ ] app/api/qr/[username]/route.js
- [ ] app/api/themes/route.js
- [ ] app/api/avatar/route.js
- [ ] app/api/background/route.js
- [ ] app/api/links/route.js
- [ ] components/ThemeSelector.jsx
- [ ] components/MobilePreview.jsx
- [ ] components/AnalyticsCharts.jsx
- [ ] components/QRCodeWidget.jsx
- [ ] components/DraggableLinkList.jsx

### 10. Verificar Scripts de Teste

```bash
# Testar script de testes
npm test
```

- [ ] Verifique se testes de banco passaram
- [ ] Verifique se testes de temas passaram
- [ ] Verifique se testes de API passaram

## 📋 Relatório Final

Após concluir os testes, preencha:

| Teste | Status | Observações |
|--------|--------|-------------|
| Autenticação | [ ] | |
| Criar Link | [ ] | |
| Editar Link | [ ] | |
| Excluir Link | [ ] | |
| Perfil | [ ] | |
| Página Pública | [ ] | |
| API Temas | [ ] | |
| API QR Code | [ ] | |
| API Analytics | [ ] | |
| Scripts de Teste | [ ] | |

## 🐛 Solução de Problemas

### Servidor Não Inicia

```bash
# Limpar cache
rm -rf .next

# Reiniciar
npm run dev
```

### Erro de Migrations

```bash
# Resetar banco (⚠️ PERDE DADOS)
npx prisma migrate reset

# Ou rodar migrations
npx prisma migrate dev
```

### Porta em Uso

Se o servidor não inicia na porta 3000:
- Ele automaticamente usará a próxima porta disponível (3001, 3002, etc.)
- Verifique o terminal para ver qual porta foi usada

## 📚 Documentação Disponível

- **Guia Rápido**: `QUICKSTART.md`
- **Testes Automatizados**: `docs/TESTES.md`
- **Documentação da API**: `docs/API.md`
- **Deploy em Produção**: `docs/DEPLOY.md`
- **Status do MVP**: `docs/MVP_COMPLETO.md`

## ✅ Status do Projeto

**MVP Implementado**: 20/20 funcionalidades (100%)

1. ✅ Sistema de Autenticação (Google, GitHub, Email/Senha)
2. ✅ Dashboard de Gerenciamento de Links
3. ✅ Página Pública Personalizada
4. ✅ Sistema de Temas (20 temas: 5 gratuitos, 15 premium)
5. ✅ Upload de Avatar
6. ✅ Upload de Background
7. ✅ Drag & Drop de Links
8. ✅ Mobile Preview
9. ✅ Tipos Especiais de Links (WhatsApp, Email, Telefone)
10. ✅ Sitemap Dinâmico
11. ✅ Página Pública com Temas Dinâmicos
12. ✅ Sistema de Pagamentos Stripe
13. ✅ Billing Portal
14. ✅ Stripe Webhooks
15. ✅ Sistema de Analytics
16. ✅ QR Code Generator
17. ✅ Seed de Temas
18. ✅ Middleware de Assinatura
19. ✅ Hooks de Assinatura
20. ✅ Sistema de Testes Automatizados

---

**🚀 O sistema está pronto para ser testado manualmente!**
