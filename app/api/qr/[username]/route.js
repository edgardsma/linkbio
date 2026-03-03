import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import prisma from '@/lib/prisma'

export async function GET(
  request,
  { params }
) {
  const username = params.username.replace('@', '')
  const { searchParams } = new URL(request.url)

  // Parâmetros opcionais
  const size = parseInt(searchParams.get('size') || '256')
  const errorCorrectionLevel = searchParams.get('errorCorrectionLevel') || 'M'

  // Validar tamanho
  if (size < 128 || size > 1024) {
    return NextResponse.json(
      { error: 'Tamanho deve estar entre 128 e 1024' },
      { status: 400 }
    )
  }

  // Validar nível de correção
  const validLevels = ['L', 'M', 'Q', 'H']
  if (!validLevels.includes(errorCorrectionLevel)) {
    return NextResponse.json(
      { error: 'Nível de correção inválido' },
      { status: 400 }
    )
  }

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado' },
      { status: 404 }
    )
  }

  // Gerar URL da página
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const pageUrl = `${baseUrl}/${username}`

  try {
    // Gerar QR Code como buffer PNG
    const qrBuffer = await QRCode.toBuffer(pageUrl, {
      width: size,
      errorCorrectionLevel: errorCorrectionLevel,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Retornar como imagem PNG
    return new NextResponse(qrBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="qr-${username}.png"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar QR Code' },
      { status: 500 }
    )
  }
}
