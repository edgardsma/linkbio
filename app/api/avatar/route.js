import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma.js'
import { authLogger } from '@/lib/logger'

// Configurações de upload
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Endpoint para upload de avatar
 * Suporta imagens JPEG, PNG, WEBP (máximo 5MB)
 */
export async function POST(request) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar')

    // Validar se arquivo foi enviado
    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WEBP' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 5MB' },
        { status: 400 }
      )
    }

    // Gerar nome do arquivo único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${user.id}-${timestamp}-${randomString}.${extension}`

    // Criar diretório de uploads se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadDir, { recursive: true })

    // Salvar arquivo
    const filePath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Atualizar usuário no banco
    const publicUrl = `/uploads/avatars/${filename}`

    await prisma.user.update({
      where: { id: user.id },
      data: { image: publicUrl },
    })

    authLogger.info('Avatar uploaded', {
      userId: user.id,
      filename,
      size: file.size,
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    })
  } catch (error) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    authLogger.error('Error uploading avatar', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      { error: 'Erro ao fazer upload do avatar' },
      { status: 500 }
    )
  }
}
