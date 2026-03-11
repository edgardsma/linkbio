import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  createLinkSchema,
  updateLinkSchema,
  reorderLinksSchema,
  validateData,
  validateDataOrThrow,
  ValidationError,
} from '../../../lib/validation'

describe('signUpSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = signUpSchema.safeParse({
      email: 'usuario@teste.com',
      password: 'Senha123',
      name: 'João Silva',
      username: 'joaosilva',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar email inválido', () => {
    const result = signUpSchema.safeParse({
      email: 'nao-e-email',
      password: 'Senha123',
      name: 'João Silva',
      username: 'joaosilva',
    })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toMatch(/email/i)
  })

  it('deve rejeitar senha sem maiúscula', () => {
    const result = signUpSchema.safeParse({
      email: 'test@test.com',
      password: 'senha123',
      name: 'João Silva',
      username: 'joao',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha sem número', () => {
    const result = signUpSchema.safeParse({
      email: 'test@test.com',
      password: 'SenhaSemNumero',
      name: 'João Silva',
      username: 'joao',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const result = signUpSchema.safeParse({
      email: 'test@test.com',
      password: 'Ab1',
      name: 'João',
      username: 'joao',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar username com caracteres especiais', () => {
    const result = signUpSchema.safeParse({
      email: 'test@test.com',
      password: 'Senha123',
      name: 'João Silva',
      username: 'joao silva',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar username menor que 3 caracteres', () => {
    const result = signUpSchema.safeParse({
      email: 'test@test.com',
      password: 'Senha123',
      name: 'Jo',
      username: 'ab',
    })
    expect(result.success).toBe(false)
  })
})

describe('createLinkSchema', () => {
  it('deve aceitar link válido', () => {
    const result = createLinkSchema.safeParse({
      title: 'Meu Website',
      url: 'https://meusite.com.br',
    })
    expect(result.success).toBe(true)
  })

  it('deve aceitar link com todos os campos', () => {
    const result = createLinkSchema.safeParse({
      title: 'WhatsApp',
      url: 'https://wa.me/5511999999999',
      description: 'Fale comigo',
      icon: '📱',
      type: 'url',
      isActive: true,
      position: 0,
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar link sem título', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar URL inválida', () => {
    const result = createLinkSchema.safeParse({
      title: 'Link',
      url: 'nao-e-url',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar título vazio', () => {
    const result = createLinkSchema.safeParse({
      title: '',
      url: 'https://example.com',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar título muito longo', () => {
    const result = createLinkSchema.safeParse({
      title: 'a'.repeat(101),
      url: 'https://example.com',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar tipo inválido', () => {
    const result = createLinkSchema.safeParse({
      title: 'Link',
      url: 'https://example.com',
      type: 'invalido',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateLinkSchema', () => {
  it('deve aceitar atualização parcial', () => {
    const result = updateLinkSchema.safeParse({
      title: 'Novo título',
    })
    expect(result.success).toBe(true)
  })

  it('deve aceitar objeto vazio (nenhum campo obrigatório)', () => {
    const result = updateLinkSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('deve rejeitar URL inválida mesmo em update', () => {
    const result = updateLinkSchema.safeParse({
      url: 'nao-e-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('deve aceitar atualização parcial de perfil', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Maria Silva',
      bio: 'Olá, sou a Maria!',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar cor hexadecimal inválida', () => {
    const result = updateProfileSchema.safeParse({
      primaryColor: 'vermelho',
    })
    expect(result.success).toBe(false)
  })

  it('deve aceitar cor hexadecimal válida', () => {
    const result = updateProfileSchema.safeParse({
      primaryColor: '#FF5733',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar bio muito longa', () => {
    const result = updateProfileSchema.safeParse({
      bio: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('reorderLinksSchema', () => {
  it('deve aceitar array de reordenação válido', () => {
    const result = reorderLinksSchema.safeParse({
      links: [
        { id: 'link1', position: 0 },
        { id: 'link2', position: 1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar sem campo links', () => {
    const result = reorderLinksSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('deve rejeitar posição negativa', () => {
    const result = reorderLinksSchema.safeParse({
      links: [{ id: 'link1', position: -1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('validateData helper', () => {
  it('deve retornar success:true para dados válidos', () => {
    const result = validateData(createLinkSchema, {
      title: 'Teste',
      url: 'https://teste.com',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('deve retornar success:false com erros formatados', () => {
    const result = validateData(createLinkSchema, {
      url: 'invalido',
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('validateDataOrThrow helper', () => {
  it('deve retornar dados validados', () => {
    const data = validateDataOrThrow(createLinkSchema, {
      title: 'Teste',
      url: 'https://teste.com',
    })
    expect(data.title).toBe('Teste')
    expect(data.url).toBe('https://teste.com')
  })

  it('deve lançar ValidationError para dados inválidos', () => {
    expect(() => {
      validateDataOrThrow(createLinkSchema, { url: 'invalido' })
    }).toThrow(ValidationError)
  })

  it('ValidationError deve ter campo errors', () => {
    try {
      validateDataOrThrow(createLinkSchema, { url: 'invalido' })
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect(err.errors).toBeDefined()
    }
  })
})
