# 📋 Documentação: Diagnóstico e Solução do Projeto LinkBio Brasil

## Resumo Executivo

Este documento descreve o processo de diagnóstico realizado no projeto **LinkBio Brasil** para identificar e resolver problemas que impediam o funcionamento correto da aplicação web.

---

## 🔍 Problema Inicial

**Situação**: A aplicação não carregava na web e os serviços (banco de dados, Redis, aplicação) não funcionavam corretamente.

**Sintomas Observados**:
- Serviços não iniciavam
- Mensagens de erro no console
- Erro: "Não foi possível adicionar o sistema de arquivos: <illegal path>"
- Mensagens relacionadas ao SES (Secure EcmaScript)

---

## 📊 Processo de Diagnóstico - Passo a Passo

### **Passo 1: Verificar Status dos Containers Docker**

#### Comando executado:
```bash
docker-compose -f docker-compose.dev.yml ps
```

#### O que faz:
- Lista todos os containers (serviços) que deveriam estar rodando
- Mostra se estão "Running", "Stopped" ou "Created"
- Indica a porta em que estão funcionando

#### Resultado encontrado:
❌ **Problema**: Containers estavam com status "Created" mas não estavam rodando ("Up")
- linkbio-db-dev: Created (deveria estar "Up")
- linkbio-redis-dev: Created (deveria estar "Up")  
- linkbio-app-dev: Não aparecia na lista

---

### **Passo 2: Analisar Healthcheck do Banco de Dados**

#### O que é um "healthcheck"?
É um teste automático que Docker executa periodicamente para verificar se um serviço está funcionando corretamente.

#### Problema identificado:
No arquivo `docker-compose.dev.yml`, a linha de healthcheck do banco de dados estava assim:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
```

**Por que isso era um problema?**
- As variáveis `${DB_USER}` e `${DB_NAME}` não estavam definidas
- O Docker não conseguia executar o teste de saúde
- O banco de dados nunca ficava "healthy"
- Como a aplicação depende do banco estar healthy, ela nunca iniciava

#### Arquivo afetado:
`docker-compose.dev.yml` - linhas 20-26

---

### **Passo 3: Corrigir o Healthcheck**

#### Solução aplicada:
Substituir as variáveis pelas valores reais:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U linkbio -d linkbio"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

#### Por que isso funciona:
- `linkbio` é o usuário real do banco de dados (configurado em `POSTGRES_USER`)
- `linkbio` é o nome real do banco de dados (configurado em `POSTGRES_DB`)
- Agora o Docker consegue verificar se o PostgreSQL está respondendo

#### Comando para aplicar:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

---

### **Passo 4: Verificar se os Serviços Iniciaram**

#### Comando:
```bash
docker-compose -f docker-compose.dev.yml ps
```

#### Resultado esperado:
```
NAME                IMAGE                STATUS                    PORTS
linkbio-db-dev      postgres:15-alpine   Up X seconds (healthy)    0.0.0.0:5432->5432/tcp
linkbio-redis-dev   redis:7-alpine       Up X seconds (healthy)    0.0.0.0:6379->6379/tcp
linkbio-app-dev     linkbio-brasil-app   Up X seconds (healthy)    0.0.0.0:3000->3000/tcp
```

✅ **Sucesso**: Todos os containers estavam "healthy"

---

### **Passo 5: Testar Conectividade da Aplicação**

#### Comando:
```bash
curl http://localhost:3000
```

#### O que faz:
- Faz uma requisição HTTP para a aplicação
- Retorna o HTML da página inicial se estiver funcionando

#### Resultado:
✅ **Status 200 OK** - A aplicação respondeu corretamente com o HTML esperado

---

## 🔧 Segunda Alteração: Desabilitar Turbopack

### **Por que foi necessária?**

Após os serviços iniciarem, foram observadas mensagens problematicas:
- `lockdown-install.js:1 SES Removing unpermitted intrinsics`
- `Não foi possível adicionar o sistema de arquivos: <illegal path>`

**O que é Turbopack?**
- É um novo bundler (compilador) criado pela Vercel
- Ainda é experimental no Next.js 16
- Funciona bem em sistemas Linux, mas tem problemas com volumes montados do Windows no Docker

**Por que causa problemas?**
- O Turbopack é muito agressivo em otimizações
- Num ambiente Docker com volumes compartilhados do Windows, isso causa conflitos
- SES (Secure EcmaScript) é uma camada de segurança que o Turbopack usa e teve problemas

### **Solução Aplicada**

#### Arquivo modificado:
`docker-compose.dev.yml` - seção de `environment` do serviço `app`

#### Antes:
```yaml
environment:
  - NODE_ENV=development
```

#### Depois:
```yaml
environment:
  - NODE_ENV=development
  - NEXT_DISABLE_TURBOPACK=1
```

#### Comando para aplicar:
```bash
docker-compose -f docker-compose.dev.yml up --build app -d
```

#### O que esse comando faz:
- `up`: Inicia os serviços
- `--build`: Reconstrói a imagem do container (para aplicar a variável)
- `app`: Especifica apenas o serviço app (não constrói db e redis novamente)
- `-d`: Executa em background

#### Resultado:
✅ **Problema resolvido** - Next.js agora usa o bundler padrão (mais estável)

---

## 📁 Estrutura do Projeto

```
linkbio-brasil/
├── app/                    # Código da aplicação Next.js
│   ├── page.js            # Página inicial
│   ├── layout.js          # Layout principal
│   └── api/               # APIs da aplicação
├── components/            # Componentes React reutilizáveis
├── lib/                   # Funções utilitárias e configurações
├── prisma/                # Definição do banco de dados
├── docker-compose.dev.yml # Configuração dos serviços (❗ ALTERADO)
├── Dockerfile.dev         # Instruções para criar a imagem Docker
├── .env.docker           # Variáves de ambiente para Docker
└── package.json          # Dependências do projeto
```

---

## 🐳 Como Funciona Docker Neste Projeto

### **O que é Docker?**
Docker é uma ferramenta que cria "containers" - ambientes isolados que contêm toda a aplicação e suas dependências. Útil porque garante que funciona igual em qualquer computador.

### **Serviços Utilizados**

#### 1. **PostgreSQL (Banco de Dados)**
```
Container: linkbio-db-dev
Imagem: postgres:15-alpine
Porta: 5432
Função: Armazena dados da aplicação (usuários, links, etc.)
```

#### 2. **Redis (Cache)**
```
Container: linkbio-redis-dev
Imagem: redis:7-alpine
Porta: 6379
Função: Armazena em cache dados temporários (sessões, etc.)
```

#### 3. **Next.js (Aplicação Web)**
```
Container: linkbio-app-dev
Imagem: linkbio-brasil-app (construída localmente)
Porta: 3000
Função: A aplicação web que você vê no navegador
```

### **Como eles se conectam**

```
Seu Navegador (localhost:3000)
         ↓
    Next.js App ←─→ PostgreSQL (localhost:5432)
         ↓
      Redis (localhost:6379)
```

---

## 🚀 Comandos Principais e Como Usar

### **1. Iniciar os Serviços**
```bash
docker-compose -f docker-compose.dev.yml up -d
```
**O que faz**: Inicia banco, Redis e aplicação em background

---

### **2. Parar os Serviços**
```bash
docker-compose -f docker-compose.dev.yml down
```
**O que faz**: Para e remove todos os containers

---

### **3. Ver Status**
```bash
docker-compose -f docker-compose.dev.yml ps
```
**O que faz**: Lista status de todos os serviços

---

### **4. Ver Logs**
```bash
docker-compose -f docker-compose.dev.yml logs app
```
**O que faz**: Mostra o que está acontecendo na aplicação
**Para sair**: Pressione `Ctrl + C`

---

### **5. Acessar a Aplicação**
```
Abra seu navegador em: http://localhost:3000
```

---

## ✅ Checklist de Funcionamento

Após as alterações, verifique:

- [ ] `docker-compose -f docker-compose.dev.yml ps` mostra todos os containers com status "Up (healthy)"
- [ ] `curl http://localhost:3000` retorna status 200
- [ ] Consegue acessar http://localhost:3000 no navegador
- [ ] As mensagens de erro não aparecem mais nos logs

---

## 🔄 Resumo das Alterações

| Arquivo | Linha | Antes | Depois | Motivo |
|---------|-------|-------|--------|--------|
| docker-compose.dev.yml | 20-26 | `pg_isready -U ${DB_USER} -d ${DB_NAME}` | `pg_isready -U linkbio -d linkbio` | Variáveis não definidas |
| docker-compose.dev.yml | 72 | `NODE_ENV=development` | `NODE_ENV=development` + `NEXT_DISABLE_TURBOPACK=1` | Turbopack causava erros |

---

## 📝 Notas Importantes

1. **O arquivo `.env.docker` é importante**: Contém as configurações de banco de dados para Docker
2. **Não altere as senhas no docker-compose**: Elas são padrão para desenvolvimento
3. **Se houver problemas**: Sempre comece verificando os logs com `docker-compose logs -f`
4. **Para desenvolvimento local sem Docker**: Use `npm run dev` (requer PostgreSQL instalado)

---

## 🆘 Troubleshooting Rápido

### Problema: "Port 3000 is already in use"
**Solução**: 
```bash
docker-compose -f docker-compose.dev.yml down
```

### Problema: Containers não iniciam
**Solução**:
```bash
docker-compose -f docker-compose.dev.yml logs
```
(analize a mensagem de erro)

### Problema: Banco de dados não conecta
**Solução**: Verifique se `linkbio-db-dev` está com status "healthy"
```bash
docker-compose -f docker-compose.dev.yml ps
```

---

**Última atualização**: 05 de Março de 2026
**Status**: ✅ Projeto em funcionamento
