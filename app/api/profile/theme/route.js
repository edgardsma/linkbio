import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * PATCH /api/profile/theme
 * Aplica um template predefinido ou salva customização visual completa.
 *
 * Body (template predefinido):
 *   { themeId: string }
 *
 * Body (customização manual):
 *   {
 *     primaryColor, secondaryColor, backgroundColor, textColor,
 *     buttonStyle, fontFamily
 *   }
 */
export async function PATCH(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { themeId, primaryColor, secondaryColor, backgroundColor, textColor, buttonStyle, fontFamily } = body

    // ── Modo 1: aplicar template predefinido ──────────────────────
    if (themeId) {
      const theme = await prisma.theme.findUnique({ where: { id: themeId } })
      if (!theme) {
        return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          themeId: theme.id,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          buttonStyle: theme.buttonStyle,
          fontFamily: theme.fontFamily,
        },
        select: {
          themeId: true,
          primaryColor: true,
          secondaryColor: true,
          backgroundColor: true,
          textColor: true,
          buttonStyle: true,
          fontFamily: true,
        },
      })

      return NextResponse.json({ success: true, theme: updated })
    }

    // ── Modo 2: customização manual ───────────────────────────────
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    const validButtonStyles = ['rounded', 'square', 'outline']
    const validFonts = ['inter', 'playfair', 'montserrat', 'poppins', 'oswald']

    if (primaryColor && !colorRegex.test(primaryColor))
      return NextResponse.json({ error: 'primaryColor inválido' }, { status: 400 })
    if (secondaryColor && !colorRegex.test(secondaryColor))
      return NextResponse.json({ error: 'secondaryColor inválido' }, { status: 400 })
    if (backgroundColor && !colorRegex.test(backgroundColor))
      return NextResponse.json({ error: 'backgroundColor inválido' }, { status: 400 })
    if (textColor && !colorRegex.test(textColor))
      return NextResponse.json({ error: 'textColor inválido' }, { status: 400 })
    if (buttonStyle && !validButtonStyles.includes(buttonStyle))
      return NextResponse.json({ error: 'buttonStyle inválido' }, { status: 400 })
    if (fontFamily && !validFonts.includes(fontFamily))
      return NextResponse.json({ error: 'fontFamily inválido' }, { status: 400 })

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { primaryColor: true, secondaryColor: true, backgroundColor: true, textColor: true, buttonStyle: true, fontFamily: true },
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        themeId: null, // Remove vínculo com template predefinido
        primaryColor: primaryColor ?? current.primaryColor,
        secondaryColor: secondaryColor ?? current.secondaryColor,
        backgroundColor: backgroundColor ?? current.backgroundColor,
        textColor: textColor ?? current.textColor,
        buttonStyle: buttonStyle ?? current.buttonStyle,
        fontFamily: fontFamily ?? current.fontFamily,
      },
      select: {
        themeId: true,
        primaryColor: true,
        secondaryColor: true,
        backgroundColor: true,
        textColor: true,
        buttonStyle: true,
        fontFamily: true,
      },
    })

    return NextResponse.json({ success: true, theme: updated })
  } catch (error) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('Error updating theme:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tema' }, { status: 500 })
  }
}

/**
 * GET /api/profile/theme
 * Retorna o tema atual do usuário.
 */
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        themeId: true,
        primaryColor: true,
        secondaryColor: true,
        backgroundColor: true,
        textColor: true,
        buttonStyle: true,
        fontFamily: true,
        theme: { select: { id: true, name: true, category: true } },
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao buscar tema' }, { status: 500 })
  }
}
