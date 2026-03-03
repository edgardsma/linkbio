# Guia de Contribuição - LinkBio Brasil

Bem-vindo ao projeto LinkBio Brasil! Agradecemos seu interesse em contribuir.

---

## 🤝 Como Contribuir

### 1. Fork o Repositório

```bash
# Faça um fork do projeto no GitHub
git clone https://github.com/seu-usuario/linkbio-brasil.git
cd linkbio-brasil
```

### 2. Crie uma Branch

```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/bug-corrigido
```

### 3. Faça suas Mudanças

- Siga o padrão de código existente
- Adicione testes quando apropriado
- Atualize a documentação

### 4. Commit suas Mudanças

```bash
git add .
git commit -m "feat: adicionar nova funcionalidade"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` manutenção

### 5. Push para a Branch

```bash
git push origin feature/sua-feature
```

### 6. Abra um Pull Request

No GitHub, abra um PR descrevendo suas mudanças.

---

## 📋 Regras do Projeto

### Padrões de Código

- **Idioma:** Português brasileiro para comentários e mensagens
- **Componentes:** camelCase (`Button`, `Input`, `Card`)
- **Arquivos:** snake_case para assets, camelCase para código
- **Indentação:** 2 espaços
- **Ponto e vírgula:** Obrigatório

### Estilo de Mensagens de Commit

```bash
# Boas práticas
feat: adicionar upload de avatar
fix: corrigir erro de autenticação
docs: atualizar README
style: formatar código
refactor: otimizar queries do Prisma

# Evitar
added avatar
fixing auth error
update readme
```

---

## 🧪 Testes

### Executar Testes

```bash
npm test
```

### Executar Testes com Cobertura

```bash
npm run test:coverage
```

---

## 📝 Code Review

### Checklist para PRs

- [ ] Código segue os padrões do projeto
- [ ] Comentários em português
- [ ] Testes incluídos (quando apropriado)
- [ ] Documentação atualizada
- [ ] Sem console.log() remanescentes
- [ ] Não há erros de lint
- [ ] Build passa sem erros

---

## 🎯 Tipos de Contribuições

### Bug Reports

Ao reportar um bug, inclua:
- Descrição do problema
- Passos para reproduzir
- Comportamento esperado
- Comportamento atual
- Screenshots (se aplicável)
- Ambiente (OS, versão Node.js)

### Feature Requests

Ao sugerir uma feature:
- Descrição clara da feature
- Caso de uso
- Possíveis alternativas
- Exemplos (se aplicável)

### Pull Requests

- Descreva claramente o que mudou
- Referencie issues relacionadas
- Adicione screenshots para mudanças de UI

---

## 🏷️ Labels do GitHub

Usamos as seguintes labels:
- `bug`: Erro a ser corrigido
- `enhancement`: Melhoria
- `documentation`: Documentação
- `good first issue`: Bom para iniciantes
- `help wanted`: Ajuda necessária
- `priority: high`: Alta prioridade
- `priority: low`: Baixa prioridade
- `wip`: Work in Progress

---

## 📞 Comunicação

### Canais

- **Issues:** Para bugs e feature requests
- **Discussions:** Para perguntas e discussões
- **Discord:** Para conversas em tempo real

### Etiqueta

- Seja respeitoso
- Aceite críticas construtivas
- Ajude outros contribuidores
- Mantenha discussões focadas no código

---

## 🎁 Benefícios

Contribuidores ativos recebem:
- Menção no README
- Badges especiais
- Acesso a features beta
- Convites para discussões de roadmap

---

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

---

**Obrigado por contribuir com o LinkBio Brasil!** 🚀
