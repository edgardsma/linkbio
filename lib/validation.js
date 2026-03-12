import { z } from 'zod'

/**
 * Schemas de Validação - LinkBio Brasil
 * Define os schemas de validação para todas as entradas da API
 */

// ============================================
// Schemas de Usuário
// ============================================

export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  username: z.string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username só pode conter letras, números e underscore'),
})

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  username: z.string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username só pode conter letras, números e underscore')
    .optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  image: z.string().url('URL da imagem inválida').optional(),
  background: z.string().max(500).refine(
    (v) => v === '' || v.startsWith('linear-gradient') || v.startsWith('radial-gradient') || (() => { try { new URL(v); return true } catch { return false } })(),
    { message: 'Background deve ser uma URL ou gradiente CSS válido' }
  ).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal').optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal').optional(),
  themeId: z.string().optional(),
})

// ============================================
// Schemas de Link
// ============================================

export const createLinkSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres'),
  url: z.string().min(1, 'URL é obrigatória'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional().nullable(),
  icon: z.string().max(50, 'Ícone deve ter no máximo 50 caracteres').optional().nullable(),
  type: z.enum([
    'url', 'email', 'phone', 'whatsapp', 'whatsapp_business',
    'youtube', 'spotify', 'tiktok', 'threads', 'soundcloud', 'twitch', 'kwai', 'podcast',
    'leadform', 'booking', 'hotmart', 'kiwify', 'eduzz', 'monetizze',
  ], {
    errorMap: () => ({ message: 'Tipo de link inválido' }),
  }).optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0, 'Posição deve ser um número inteiro positivo').optional(),
})

export const updateLinkSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres').optional(),
  url: z.string().min(1, 'URL é obrigatória').optional(),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional().nullable(),
  icon: z.string().max(200, 'Ícone deve ter no máximo 200 caracteres').optional().nullable(),
  type: z.enum([
    'url', 'email', 'phone', 'whatsapp', 'whatsapp_business',
    'youtube', 'spotify', 'tiktok', 'threads', 'soundcloud', 'twitch', 'kwai', 'podcast',
    'leadform', 'booking', 'hotmart', 'kiwify', 'eduzz', 'monetizze',
  ]).optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0, 'Posição deve ser um número inteiro positivo').optional(),
})

export const reorderLinksSchema = z.object({
  links: z.array(z.object({
    id: z.string(),
    position: z.number().int().min(0),
  })),
})

// ============================================
// Schemas de Tema
// ============================================

export const createThemeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar em formato hexadecimal'),
  isPremium: z.boolean().optional(),
})

export const updateThemeSchema = createThemeSchema.partial()

// ============================================
// Schemas de Autenticação
// ============================================

export const tokenRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

// ============================================
// Schemas de Analytics
// ============================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime('Data de início inválida').optional(),
  endDate: z.string().datetime('Data final inválida').optional(),
  limit: z.number().int().min(1, 'Limite deve ser pelo menos 1').max(100, 'Limite máximo é 100').optional(),
  offset: z.number().int().min(0, 'Offset deve ser um número não negativo').optional(),
})

// ============================================
// Helpers de Validação
// ============================================

/**
 * Valida dados usando um schema Zod
 * @param {z.ZodSchema} schema - Schema Zod para validar
 * @param {unknown} data - Dados a serem validados
 * @returns {Object} - { success, data?, errors? }
 */
export function validateData(schema, data) {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = {}
  result.error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })

  return { success: false, errors }
}

/**
 * Valida dados e lança erro se inválido
 * @param {z.ZodSchema} schema - Schema Zod para validar
 * @param {unknown} data - Dados a serem validados
 * @returns {Object} - Dados validados
 * @throws {Error} - Lança erro se dados inválidos
 */
export function validateDataOrThrow(schema, data) {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = {}
    result.error.issues.forEach((err) => {
      const path = err.path.join('.')
      errors[path] = err.message
    })
    throw new ValidationError(errors)
  }

  return result.data
}

/**
 * Classe de erro de validação personalizada
 */
export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

// ============================================
// Middleware de Validação para Next.js
// ============================================

/**
 * Cria um middleware de validação para Next.js API routes
 * @param {z.ZodSchema} schema - Schema Zod para validar
 * @returns {Function} - Middleware function
 */
export function validateBody(schema) {
  return async (request) => {
    try {
      const body = await request.json()
      const validated = validateDataOrThrow(schema, body)
      return validated
    } catch (error) {
      if (error instanceof ValidationError) {
        return { error: 'Dados inválidos', details: error.errors }
      }
      throw error
    }
  }
}

/**
 * Valida query parameters
 * @param {z.ZodSchema} schema - Schema Zod para validar
 * @param {URLSearchParams} searchParams - Query parameters
 * @returns {Object} - Dados validados
 */
export function validateQuery(schema, searchParams) {
  const data = {}
  for (const [key, value] of searchParams.entries()) {
    data[key] = value
  }
  return validateDataOrThrow(schema, data)
}
