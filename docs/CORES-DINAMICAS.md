# Cores Dinâmicas do Tema

## 📝 Visão Geral

A página pública do LinkBio (`app/[username]/page.js`) agora suporta cores dinâmicas baseadas nas preferências do usuário. Isso permite que cada usuário tenha uma página personalizada com sua própria identidade visual.

## 🎨 Funcionalidades Implementadas

### 1. Cores do Tema

O sistema suporta quatro cores principais que podem ser personalizadas por cada usuário:

- **primaryColor** - Cor primária usada para:
  - Borda do avatar
  - Link no footer
  - Início do gradiente dos links

- **secondaryColor** - Cor secundária usada para:
  - Final do gradiente dos links
  - Overlay de fundo sutil

- **backgroundColor** - Cor de fundo da página:
  - Cor base do background
  - Overlay do background personalizado (quão configurado)

- **textColor** - Cor do texto:
  - Nome do usuário
  - Biografia
  - Mensagens de estado

### 2. Gradientes

Os links usam um gradiente dinâmico que vai de `primaryColor` para `secondaryColor`:

```css
background: linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%);
```

### 3. Cores Padrão

Quando um usuário não tem cores personalizadas definidas, o sistema usa cores padrão:

```javascript
{
  primary: '#667eea',      // Roxo
  secondary: '#764ba2',    // Lilás
  background: '#f9fafb',    // Cinza claro
  text: '#111827',          // Preto suave
}
```

## 📁 Arquivos Modificados

### `C:\Projetos\linkbio-brasil\app\[username]\page.js`

**Principais alterações:**

1. **Busca de cores do usuário:**
   ```javascript
   const themeColors = {
     primary: user.primaryColor || '#667eea',
     secondary: user.secondaryColor || '#764ba2',
     background: user.backgroundColor || '#f9fafb',
     text: user.textColor || '#111827',
   }
   ```

2. **Aplicação de cores dinâmicas via inline styles:**
   - Background principal: `backgroundColor: themeColors.background`
   - Borda do avatar: `border: 4px solid ${themeColors.primary}`
   - Texto do perfil: `color: themeColors.text`
   - Gradiente dos links: `background: linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`
   - Link do footer: `color: themeColors.primary`

3. **Overlay de background personalizado:**
   ```javascript
   backgroundColor: `${themeColors.background}80`
   ```
   (O "80" adiciona 50% de transparência)

4. **Gradiente sutil de overlay:**
   ```javascript
   backgroundImage: `linear-gradient(135deg, ${themeColors.primary}10 0%, ${themeColors.secondary}10 100%)`
   ```
   (O "10" adiciona 6% de transparência para um efeito sutil)

## 🗄️ Banco de Dados

O modelo `User` já possui os campos de cor definidos no schema do Prisma:

```prisma
model User {
  // ... outros campos ...

  primaryColor      String    @default("#667eea")
  secondaryColor   String    @default("#764ba2")
  backgroundColor String    @default("#f9fafb")
  textColor        String    @default("#111827")

  // ... relacionamentos ...
}
```

## 🎯 Exemplos de Uso

### Tema Padrão (Roxo/Lilás)
```json
{
  "primaryColor": "#667eea",
  "secondaryColor": "#764ba2",
  "backgroundColor": "#f9fafb",
  "textColor": "#111827"
}
```

### Tema Escuro Personalizado
```json
{
  "primaryColor": "#ff6b6b",
  "secondaryColor": "#feca57",
  "backgroundColor": "#2d3436",
  "textColor": "#ffffff"
}
```

### Tema Azul Marinho
```json
{
  "primaryColor": "#0ea5e9",
  "secondaryColor": "#6366f1",
  "backgroundColor": "#1e293b",
  "textColor": "#f8fafc"
}
```

## 🚀 Como Testar

### 1. Criar um usuário com cores personalizadas

Use o script de teste:

```bash
node scripts/test-theme-colors.mjs
```

Isso criará um usuário `testecores` com cores personalizadas e alguns links de teste.

### 2. Acessar a página

Navegue para: `http://localhost:3000/testecores`

### 3. Verificar as cores

- O fundo deve ser cinza escuro (`#2d3436`)
- Os links devem ter um gradiente vermelho-amarelo (`#ff6b6b` → `#feca57`)
- O texto deve ser branco (`#ffffff`)
- A borda do avatar deve ser vermelha (`#ff6b6b`)
- O link do footer deve ser vermelho (`#ff6b6b`)

## 🎨 Considerações de Design

### Acessibilidade

- As cores são aplicadas com contraste suficiente para legibilidade
- Os links sempre usam texto branco (`#ffffff`) sobre o gradiente colorido
- As descrições dos links usam branco com 85% de opacidade

### Responsividade

- O sistema funciona perfeitamente em dispositivos móveis e desktop
- As cores se adaptam automaticamente a diferentes tamanhos de tela

### Performance

- As cores são aplicadas via inline styles, que são renderizados eficientemente pelo navegador
- Não há cálculos complexos ou JavaScript adicional no cliente

## 🔧 Próximas Melhorias

1. **Seletor de Cores no Dashboard**
   - Adicionar um componente para selecionar cores visualmente
   - Permitir preview em tempo real

2. **Temas Predefinidos**
   - Criar uma biblioteca de temas populares
   - Permitir alternar facilmente entre temas

3. **Exportar/Importar Temas**
   - Permitir que usuários compartilhem seus temas
   - Salvar temas favoritos

4. **Animações de Transição**
   - Adicionar transições suaves ao trocar de tema
   - Efeitos hover mais elaborados

## 📝 Notas

- As cores são armazenadas como strings hexadecimais (ex: `#667eea`)
- O sistema usa fallback automático para cores padrão
- A funcionalidade é totalmente compatível com background personalizado existente
- Não há necessidade de alterações no banco de dados (os campos já existem)

---

**Última atualização:** 03/03/2026
**Versão:** 1.0.0
