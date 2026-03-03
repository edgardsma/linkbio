# Guia de Instalação Rápida - LinkBio Brasil

Este guia vai ajudar você a configurar o LinkBio Brasil em poucos minutos.

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

- **Node.js 18+** instalado ([baixar aqui](https://nodejs.org/))
- **Git** instalado (opcional)
- Um editor de código (recomendado: VS Code)

## 🚀 Instalação Passo a Passo

### 1. Clone ou baixe o projeto

**Via Git:**
```bash
git clone https://github.com/seu-usuario/linkbio-brasil.git
cd linkbio-brasil
```

**Ou baixando o ZIP:**
1. Baixe o ZIP do projeto
2. Extraia na sua pasta de preferência
3. Abra a pasta no terminal

### 2. Instale as dependências

```bash
npm install
```

Isso vai instalar todas as bibliotecas necessárias (pode levar alguns minutos).

### 3. Configure as variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Abra o arquivo `.env` em um editor de texto
3. Gere uma chave secreta para o NextAuth:
```bash
openssl rand -base64 32
```
4. Cole a chave gerada no campo `NEXTAUTH_SECRET` no arquivo `.env`

**Nota:** Os campos de OAuth (Google, GitHub) são opcionais. Se não configurar, apenas o login com email/senha estará disponível.

### 4. Inicie o banco de dados

Em um terminal separado (deixe este rodando):
```bash
npx prisma dev
```

Aguarde a mensagem: "✔ Great Success! 😉👍"

### 5. Execute as migrações do banco de dados

Em outro terminal:
```bash
npx prisma migrate dev
```

### 6. Inicie o projeto de desenvolvimento

```bash
npm run dev
```

### 7. Acesse o projeto

Abra seu navegador e acesse: **http://localhost:3000**

## ✅ Verificação da Instalação

Para verificar se tudo está funcionando:

1. ✅ A página inicial deve carregar
2. ✅ Clique em "Criar Conta"
3. ✅ Preencha o formulário de cadastro
4. ✅ Você deve ser redirecionado para o Dashboard
5. ✅ Adicione um link
6. ✅ Acesse sua página pública clicando em "Visualizar Página"

## 🔧 Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Iniciar servidor de produção
npm start

# Visualizar banco de dados (Prisma Studio)
npm run prisma:studio

# Criar nova migração
npm run prisma:migrate

# Reiniciar banco de dados local
npm run prisma:dev
```

## 🐛 Solução de Problemas

### "Cannot find module 'prisma'"

```bash
npm install
npm run prisma:generate
```

### "Database connection failed"

Verifique se o banco de dados está rodando em outro terminal:
```bash
npx prisma dev
```

### Erro de porta 3000 em uso

```bash
# Usar outra porta
PORT=3001 npm run dev
```

### "NextAuth configuration error"

Verifique se o arquivo `.env` está configurado corretamente com o `NEXTAUTH_SECRET`.

## 📝 Próximos Passos

Após a instalação bem-sucedida:

1. **Configure sua página:** Adicione sua foto, bio e links
2. **Personalize o design:** Edite o `tailwind.config.js` para mudar as cores
3. **Configure OAuth:** Adicione login com Google/GitHub (opcional)
4. **Configure Stripe:** Adicione pagamentos premium (opcional)

## 📚 Documentação Completa

Para mais detalhes, consulte o arquivo [README.md](README.md).

## 🤝 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique a seção de [Solução de Problemas](#-solução-de-problemas)
2. Abra uma issue no GitHub
3. Entre em contato: contato@linkbio-brasil.com

---

**Parabéns!** 🎉 O LinkBio Brasil está instalado e pronto para uso!
