> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# Guia de Testes - LinkBio Brasil

Data: 03/03/2026

---

## 📋 Índice

- [Pré-requisitos para Testes](#pré-requisitos-para-testes)
- [Preparação do Ambiente](#preparação-do-ambiente)
- [Testes Funcionais](#testes-funcionais)
  - [Autenticação](#autenticação)
  - [Dashboard](#dashboard)
  - [Links](#links)
  - [Perfil](#perfil)
  - [Temas](#temas)
  - [Pagamentos (Stripe)](#pagamentos-stripe)
  - [Página Pública](#página-pública)
  - [Preview Mobile](#preview-mobile)
- [Testes de Integração](#testes-de-integração)
- [Checklist de Validação Final](#checklist-de-validação-final)

---

## 🔧 Pré-requisitos para Testes

### 1. Banco de Dados PostgreSQL

```bash
# Iniciar o banco de dados
npx prisma dev

# Verificar se está rodando na porta 51213
```

### 2. Variáveis de Ambiente

Verifique se o arquivo `.env` está configurado:

```env
# Database (obrigatório)
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."

# NextAuth (obrigatório)
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (opcional)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

GITHUB_CLIENT_ID="seu-github-client-id"
GITHUB_CLIENT_SECRET="seu-github-client-secret"

# Stripe (opcional para testes de pagamento)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Dependências Instaladas

```bash
npm install

# Ou se precisar instalar algo específico:
npm install stripe next-auth/react bcryptjs
```

---

## 🚀 Preparação do Ambiente

### Passo 1: Iniciar o Banco de Dados

```bash
# Terminal 1 - Banco de dados
npx prisma dev

# Deixe rodando em um terminal separado
```

### Passo 2: Executar Migrations

```bash
# Terminal 2 - Aplicar migrations
npx prisma migrate dev

# Deve mostrar: "Your database is now in sync with your schema changes."
```

### Passo 3: Inserir Temas no Banco

```bash
# Terminal 2 - Inserir temas
curl -X POST http://localhost:3000/api/seed

# Deve mostrar:
# {
#   "success": true,
#   "message": "Temas inseridos com sucesso",
#   "created": 20,
#   "skipped": 0,
#   "total": 20
# }
```

### Passo 4: Iniciar o Servidor de Desenvolvimento

```bash
# Terminal 2 - Aplicar migrations
npm run dev

# Deve mostrar:
# ready - started server on 0.0.0.0 (http://localhost:3000)
```

### Passo 5: Verificar Servidor

Acesse http://localhost:3000 no navegador.

---

## ✅ Testes Funcionais

### 1. Autenticação

#### 🔹 Teste 1: Registro com Email/Senha

1. Acesse `http://localhost:3000/auth/signup`
2. Preencha o formulário:
   - Nome: "Usuário Teste"
   - Username: "usuarioteste" (único)
   - Email: "teste@email.com"
   - Senha: "senha123"
3. Clique em "Criar Conta"
4. **Resultado Esperado:** Redirecionamento para `/dashboard`
5. **Validação:**
   - [ ] Criou conta no banco de dados
   - [ ] Senha está hasheada (verificar em Prisma Studio)
   - [ ] Redirecionou para o dashboard

#### 🔹 Teste 2: Login com Email/Senha

1. Acesse `http://localhost:3000/auth/login`
2. Entre com o email e senha criados
3. Clique em "Entrar"
4. **Resultado Esperado:** Redirecionamento para `/dashboard`
5. **Validação:**
   - [ ] Autenticação bem-sucedida
   - [ ] Sessão criada
   - [ ] Dashboard carregado com nome do usuário

#### 🔹 Teste 3: Login com Google (Opcional)

1. Configure credenciais no `.env`
2. Acesse `http://localhost:3000/auth/login`
3. Clique em "Entrar com Google"
4. **Resultado Esperado:** Popup do Google, redirecionamento, dashboard
5. **Validação:**
   - [ ] Usuário criado/autenticado
   - [ ] Google OAuth funcionando

#### 🔹 Teste 4: Logout

1. No dashboard, clique no nome do usuário
2. Selecione "Sair" (ou similar)
3. **Resultado Esperado:** Redirecionamento para login
4. **Validação:**
   - [ ] Sessão encerrada
   - [ ] Redirecionado para `/`

---

### 2. Dashboard

#### 🔹 Teste 1: Visualizar Dashboard

1. Acesse `http://localhost:3000/dashboard` (após login)
2. **Resultado Esperado:** Dashboard carregado
3. **Validação:**
   - [ ] Nome do usuário exibido
   - [ ] "Meus Links" section visível
   - [ ] "Estatísticas Rápidas" visível
   - [ ] Mobile Preview visível (botão flutuante)

#### 🔹 Teste 2: Adicionar Link

1. Clique em "+ Adicionar Link"
2. Preencha o formulário:
   - Título: "Meu Site"
   - URL: "https://exemplo.com"
   - Ícone: "🔗"
   - Descrição: "Veja meus projetos"
3. Clique em "Adicionar"
4. **Resultado Esperado:** Link adicionado à lista
5. **Validação:**
   - [ ] Link aparece na lista
   - [ ] Ícone correto
   - [ ] Posição correta

#### 🔹 Teste 3: Editar Link

1. No link, clique no botão azul (lápis)
2. Altere o título para "Meu Site Atualizado"
3. Clique em "Salvar"
4. **Resultado Esperado:** Link atualizado
5. **Validação:**
   - [ ] Título foi atualizado
   - [ ] Modal fechou
   - [ ] Lista atualizada

#### 🔹 Teste 4: Ativar/Inativar Link

1. Clique no botão "Ativo" / "Inativo"
2. **Resultado Esperado:** Estado mudou
3. **Validação:**
   - [ ] Texto do botão mudou
   - [ ] Cor do botão mudou

#### 🔹 Teste 5: Excluir Link

1. Clique no ícone de lixeira
2. Confirme no popup
3. **Resultado Esperado:** Link removido
4. **Validação:**
   - [ ] Confirm apareceu
   - [ ] Link foi excluído

#### 🔹 Teste 6: Drag and Drop

1. Arraste um link para baixo de outro link
2. Solte-o
3. **Resultado Esperado:** Links reordenados
4. **Validação:**
   - [ ] Links trocaram de posição
   - [ ] Ordem mantida após atualizar página

#### 🔹 Teste 7: QR Code

1. Na seção "Sua Página" (ou widget)
2. Selecione tamanho (256px)
3. **Resultado Esperado:** QR Code gerado
4. **Validação:**
   - [ ] QR Code aparece
   - [ ] Botão "Baixar PNG" funciona
   - [ ] Download inicia com nome correto

#### 🔹 Teste 8: Analytics Charts

1. Role até ver "Estatísticas Rápidas"
2. Clique em "Visão Geral"
3. **Validação:**
   - [ ] Cards de estatísticas visíveis
   - [ ] Números corretos (total de cliques, links, etc.)
4. Teste outras abas: "Links" e "Tempo"
   - [ ] Gráficos são exibidos
   - [ ] Top Links com percentual aparece

---

### 3. Links

#### 🔹 Teste 1: Criar Link com Tipos Especiais

**WhatsApp:**
1. Clique em "+ Adicionar Link"
2. Selecione tipo "WhatsApp"
3. Digite: "11999999999"
4. Título: "Fale comigo no WhatsApp"
5. Salve
6. **Validação:**
   - [ ] Link criado com tipo whatsapp
   - [ ] URL formatada como `https://wa.me/55119999999999`

**Email:**
1. Crie novo link
2. Selecione tipo "Email"
3. Digite: "teste@email.com"
4. Título: "Envie um Email"
5. Salve
6. **Validação:**
   - [ ] Link criado com tipo email
   - [ ] URL formatada como `mailto:teste@email.com`

**Telefone:**
1. Crie novo link
2. Selecione tipo "Telefone"
3. Digite: "11999999999"
4. Título: "Ligue para Mim"
5. Salve
6. **Validação:**
   - [ ] Link criado com tipo phone
   - [ ] URL formatada como `tel:+55119999999999`

#### 🔹 Teste 2: Limites por Plano

1. Tente criar mais de 5 links (plano FREE)
2. **Resultado Esperado:** Aviso de limite ou impedimento
3. **Validação:**
   - [ ] Mensagem de limite aparece
   - [ ] Não permite criar mais links

---

### 4. Perfil

#### 🔹 Teste 1: Visualizar Página de Perfil

1. Acesse `http://localhost:3000/profile`
2. **Resultado Esperado:** Formulário de edição carregado
3. **Validação:**
   - [ ] Nome atual está preenchido
   - [ ] Username atual
   - [ ] Bio atual
   - [ ] Avatar atual (ou placeholder)

#### 🔹 Teste 2: Upload de Avatar

1. Clique em "Alterar Foto"
2. Selecione uma imagem (JPEG/PNG/WebP, máx 5MB)
3. **Resultado Esperado:** Upload concluído
4. **Validação:**
   - [ ] Arquivo enviado
   - [ ] Loading aparece
   - [ ] Avatar atualizado na prévia
   - [ ] Imagem salva em `public/uploads/avatars/`
   - [ ] Erro se arquivo inválido ou muito grande

#### 🔹 Teste 3: Upload de Background

1. Role até ver "Imagem de Fundo"
2. Clique em "Carregar Imagem"
3. Selecione uma imagem (JPEG/PNG/WebP, máx 10MB)
4. **Resultado Esperado:** Upload concluído
5. **Validação:**
   - [ ] Arquivo enviado
   - [ ] Loading aparece
   - [ ] Preview atualizado
   - [ ] Imagem salva em `public/uploads/backgrounds/`

#### 🔹 Teste 4: Atualizar Informações

1. Altere o nome
2. Altere a bio
3. Clique em "Salvar Alterações"
4. **Resultado Esperado:** Perfil atualizado
5. **Validação:**
   - [ ] Sucesso aparece
   - [ ] Redireciona automaticamente
   - [ ] Perfil persiste no banco

#### 🔹 Teste 5: Visualizar Link Público

1. Veja o URL da sua página
2. **Validação:**
   - [ ] URL está no formato correto

---

### 5. Temas

#### 🔹 Teste 1: Seleção de Temas Gratuitos

1. No dashboard, role até ver a seção de temas
2. Clique em "Temas" para expandir
3. Clique em um tema gratuito (ex: "ocean", "forest", "sunset", "midnight")
4. **Resultado Esperado:** Tema aplicado
5. **Validação:**
   - [ ] Preview do tema aparece
   - [ ] Cores são aplicadas
   - [ ] Sucesso mensagem aparece

#### 🔹 Teste 2: Tema Customizado

1. Clique em "Customizado"
2. Altere as cores:
   - Primária: Escolha uma cor
   - Secundária: Escolha uma cor
   - Fundo: Escolha uma cor
   - Texto: Escolha uma cor
3. Clique em "Aplicar Tema Customizado"
4. **Resultado Esperado:** Tema customizado aplicado
5. **Validação:**
   - [ ] Preview atualiza em tempo real
   - [ ] Cores são aplicadas imediatamente

#### 🔹 Teste 3: Preview em Tempo Real

1. Altere uma cor no modo customizado
2. Observe o preview abaixo/atual
3. **Validação:**
   - [ ] Preview atualiza instantaneamente
   - [ ] Card de preview reflete as novas cores

---

### 6. Pagamentos (Stripe)

> **NOTA:** Testes completos de pagamento requerem chaves reais do Stripe. Use modo de teste da Stripe.

#### 🔹 Teste 1: Página de Preços

1. Acesse `http://localhost:3000/pricing`
2. **Resultado Esperado:** Cards de 4 planos visíveis
3. **Validação:**
   - [ ] Plano FREE: R$ 0
   - [ ] Plano STARTER: R$ 19,90 (mensal) / R$ 199 (anual)
   - [ ] Plano PRO: R$ 49,90 (mensal) / R$ 499 (anual)
   - [ ] Plano PREMIUM: R$ 99,90 (mensal) / R$ 999 (anual)
   - [ ] Toggle mensal/anual funciona (com desconto)
   - [ ] Lista de recursos com checkmarks
   - [ ] Badge "Mais Popular" no PRO
   - [ ] Design responsivo

#### 🔹 Teste 2: Toggle Mensal/Anual

1. Clique no toggle (Mensal ↔ Anual)
2. **Resultado Esperado:** Preços mudam
3. **Validação:**
   - [ ] Preços anuais aparecem
   - [ ] Desconto de ~17% é mostrado
   - [ ] Preços atualizam instantaneamente

#### 🔹 Teste 3: Selecionar Plano

1. Escolha o plano STARTER
2. Clique em "Assinar"
3. **Resultado Esperado:** Redirecionamento para checkout
4. **Validação:**
   - [ ] Redireciona para Stripe
   - [ ] URL de checkout é correta
   - [ ] Usuário autenticado

#### 🔹 Teste 4: Plano Atual

1. No pricing, clique em "Ver meu plano" (ou similar)
2. **Resultado Esperado:** Redirecionamento para billing
3. **Validação:**
   - [ ] Dashboard de billing carregado
   - [ ] Plano atual é exibido
   - [ ] Próxima data de cobrança

#### 🔹 Teste 5: Portal do Cliente

1. No dashboard de billing, clique em "Gerenciar Assinatura"
2. **Resultado Esperado:** Abre portal do Stripe
3. **Validação:**
   - [ ] Abre em nova aba/janela
   - [ ] Permite cancelar/alterar plano

---

### 7. Página Pública

#### 🔹 Teste 1: Acessar Página Pública

1. Acesse `http://localhost:3000/[username]` (substitua [username] pelo seu username)
2. **Resultado Esperado:** Página pública carregada
3. **Validação:**
   - [ ] Avatar aparece
   - [ ] Nome e username aparecem
   - [ ] Bio aparece (se houver)
   - [ ] Links ativos são exibidos
   - [ ] Layout responsivo

#### 🔹 Teste 2: Clicar em Links

1. Clique em qualquer link
2. **Resultado Esperado:** Redirecionamento para URL do link
3. **Validação:**
   - [ ] Redirecionamento ocorre
   - [ ] Link abre em nova aba
   - [ ] Contador de cliques incrementa (verificar no Prisma Studio)

#### 🔹 Teste 3: Links Especiais

**WhatsApp:**
1. Crie um link tipo WhatsApp
2. Acesse a página pública
3. Clique no link
4. **Resultado Esperado:** Abre WhatsApp Web
5. **Validação:**
   - [ ] Link está no formato `https://wa.me/55...`

**Email:**
1. Crie um link tipo Email
2. Acesse a página pública
3. Clique no link
4. **Resultado Esperado:** Abre cliente de email
5. **Validação:**
   - [ ] Link está no formato `mailto:...`

**Telefone:**
1. Crie um link tipo Telefone
2. Acesse a página pública
3. Clique no link
4. **Resultado Esperado:** Abre discador
5. **Validação:**
   - [ ] Link está no formato `tel:+55...`

#### 🔹 Teste 4: Temas Aplicados

1. No perfil, selecione um tema diferente (ex: "ocean")
2. Acesse a página pública
3. **Resultado Esperado:** Cores do tema aplicadas
4. **Validação:**
   - [ ] Cor de fundo está correta
   - [ ] Links usam gradiente correto
   - [ ] Texto tem cor legível

#### 🔹 Teste 5: Background Personalizado

1. No perfil, faça upload de uma imagem de fundo
2. Acesse a página pública
3. **Resultado Esperado:** Background aparece
4. **Validação:**
   - [ ] Imagem de fundo é exibida
   - [ ] Overlay escuro está presente
   - [ ] Links permanecem legíveis

#### 🔹 Teste 6: SEO e Sitemap

1. Acesse `http://localhost:3000/sitemap.xml`
2. **Resultado Esperado:** XML com todas as páginas
3. **Validação:**
   - [ ] URL principal está incluída
   - [ ] Páginas de usuários com links estão incluídas
   - [ ] lastModified está correto
   - [ ] priority está definido

---

### 8. Preview Mobile

#### 🔹 Teste 1: Abrir Preview

1. No dashboard, o preview deve aparecer automaticamente
2. Clique no botão "Preview Mobile" (se não estiver visível)
3. **Resultado Esperado:** Modal de celular aparece
4. **Validação:**
   - [ ] Moldura de celular visível
   - [ ] Tela mostra conteúdo da página
   - [ ] Barra de status aparece
   - [ ] Links são renderizados
   - [ ] Botão home redondo aparece

#### 🔹 Teste 2: Fechar Preview

1. Clique no X para fechar
2. **Resultado Esperado:** Modal fecha
3. **Validação:**
   - [ ] Modal desaparece
   - [ ] Botão flutuante aparece novamente

#### 🔹 Teste 3: Responsividade

1. Diminua a largura da janela do navegador
2. **Resultado Esperado:** Preview continua funcional
3. **Validação:**
   - [ ] Preview permanece acessível
   - [ ] Conteúdo não é quebrado

---

### 9. Drag and Drop

#### 🔹 Teste 1: Arrastar e Soltar

1. No dashboard, arraste um link para baixo de outro
2. Solte-o
3. **Resultado Esperado:** Links reordenados
4. **Validação:**
   - [ ] Links trocaram de posição visualmente
   - [ ] Posições são salvas no banco
   - [ ] Contadores de cliques mantidos

#### 🔹 Teste 2: Feedback Visual

1. Observe as cores durante o arrasto
2. **Validação:**
   - [ ] Borda destaca quando dragging
   - [ ] Zona de drop aparece quando arrastando sobre
   - [ ] Cursor de arraste aparece

---

## 🔧 Testes de Integração

### 1. Teste de Carga

```bash
# Testar o número de cliques que a página pode suportar
npx prisma studio

# Verifique se há indexes apropriados
```

### 2. Teste de Concorrência

Abra 2+ abas diferentes com contas diferentes simultaneamente:
- [ ] Links podem ser criados simultaneamente
- [ ] Cliques são contados corretamente
- [ ] Sem conflitos de banco de dados

---

## ✅ Checklist de Validação Final

### Autenticação
- [ ] Registro funciona corretamente
- [ ] Login com email/senha funciona
- [ ] Login com Google funciona (se configurado)
- [ ] Logout funciona
- [ ] Senhas estão hasheadas (verificar no Prisma Studio)
- [ ] Sessões são criadas corretamente
- [ ] Redirecionamento após login funciona
- [ ] Redirecionamento após logout funciona

### Dashboard
- [ ] Dashboard carrega corretamente após login
- [ ] Criar link funciona
- [ ] Editar link funciona
- [ ] Ativar/inativar link funciona
- [ ] Excluir link funciona
- [ ] Drag-and-drop funciona
- [ ] QR Code é gerado corretamente
- [ ] Download de QR Code funciona
- [ ] Analytics charts são exibidos
- [ ] Estatísticas rápidas estão corretas
- [ ] Top links com percentual funciona

### Links
- [ ] Links são listados corretamente
- [ ] Tipos de links funcionam (URL, WhatsApp, Email, Telefone)
- [ ] Formatação de URLs está correta
- [ ] Ícones são exibidos
- [ ] Contadores de cliques são atualizados
- [ ] Limites por plano são respeitados

### Perfil
- [ ] Página de perfil carrega
- [ ] Upload de avatar funciona (5MB)
- [ ] Upload de background funciona (10MB)
- [ ] Validação de arquivo funciona
- [ ] Atualização de perfil funciona
- [ ] Link público é exibido
- [ ] Temas podem ser selecionados
- [ ] Cores customizadas funcionam

### Temas
- [ ] Endpoint `/api/themes` retorna lista de temas
- [ ] Endpoint `/api/user/theme` atualiza tema
- [ ] 20 temas são retornados (5 gratuitos + 15 premium)
- [ ] Tema customizado funciona
- [ ] Preview em tempo real funciona
- [ ] Validação de plano premium funciona

### Página Pública
- [ ] Página pública carrega com tema do usuário
- [ ] Cores dinâmicas são aplicadas
- [ ] Background personalizado é exibido
- [ ] Overlay de fundo mantém legibilidade
- [ ] Layout responsivo funciona
- [ ] SEO tags estão presentes
- [ ] Links ativos são exibidos
- [ ] Links inativos não aparecem
- [ ] Clique nos links redireciona corretamente

### Preview Mobile
- [ ] Preview mobile aparece automaticamente
- [ ] Moldura de celular é renderizada
- [ ] Conteúdo reflete página pública
- [ ] Botão de fechar funciona
- [ ] Responsividade mantida

### Pagamentos
- [ ] Página de preços é exibida
- [ ] 4 planos são mostrados
- [ ] Preços estão corretos
- [ ] Toggle mensal/anual funciona
- [ ] Botões de assinatura funcionam
- [ ] Lista de recursos está correta
- [ ] Checkout endpoint cria sessão do Stripe
- [ ] Portal endpoint cria link do Stripe

### Sitemap
- [ ] `/sitemap.xml` é gerado
- [ ] Página inicial está incluída
- [ ] Páginas de usuários com links estão incluídas
- [ ] lastModified é correto
- [ ] priority está definido

### Geral
- [ ] Aplicação não tem erros de console
- [ ] Todas as páginas funcionam
- [ ] API responde corretamente
- [ ] Banco de dados está sincronizado
- [ ] Validações funcionam

---

## 🚨 Como Executar Testes Automatizados

### Usando Test Scripts

```bash
# Teste de temas
npm run test:themes

# Teste de API
npm run test:api

# Teste completo
npm run test
```

### Manual

Execute cada item do checklist acima manualmente.

---

## 🐛 Troubleshooting Comum

### Erro: "Database connection failed"

**Causa:** Banco de dados não está rodando

**Solução:**
```bash
# Inicie o PostgreSQL
npx prisma dev
```

### Erro: "Cannot find module 'prisma/client'"

**Causa:** Cliente Prisma não foi gerado

**Solução:**
```bash
npx prisma generate
```

### Erro: "NEXTAUTH_SECRET not configured"

**Causa:** Variável não está no `.env`

**Solução:**
```bash
# Gere uma chave secreta
openssl rand -base64 32

# Adicione ao .env
NEXTAUTH_SECRET="chave-gerada-aqui"
```

### Erro: "Stripe configuration error"

**Causa:** Chaves do Stripe não estão configuradas

**Solução:**
- Adicione chaves de teste do Stripe ao `.env`
- Use chaves de teste (`sk_test_...`, `pk_test_...`)

---

## 📝 Relatório de Testes

Após completar todos os testes:

1. Preencha o checklist acima
2. Anote quaisquer bugs encontrados
3. Anote quaisquer funcionalidades não funcionaram
4. Capture screenshots se necessário
5. Documente os resultados

### Exemplo de Relatório:

```
## Relatório de Testes - LinkBio Brasil
Data: 03/03/2026
Responsável: [Seu Nome]

### Status Geral
✅ Autenticação: 100%
✅ Dashboard: 100%
✅ Links: 100%
✅ Perfil: 100%
✅ Temas: 100%
✅ Página Pública: 100%
✅ Pagamentos: 80% (aguardando chaves Stripe reais)

### Bugs Encontrados
- [ ] Bug 1: Descrição breve
- [ ] Bug 2: Descrição breve

### Funcionalidades Não Testadas
- [ ] N/A

### Observações
- Notas adicionais sobre a implementação
```

---

## 🎉 Próximos Passos Após Testes

1. Corrigir quaisquer bugs encontrados
2. Implementar funcionalidades faltantes
3. Preparar para deploy em produção
4. Configurar Stripe com chaves reais
5. Atualizar documentação se necessário

---

**Boa sorte nos testes!** 🚀
