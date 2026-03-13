import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function GET() {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(coupons)
}

export async function POST(request) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { code, discount, type = 'percent', maxUses, expiresAt, description } = body

  if (!code || discount === undefined || discount === null) {
    return NextResponse.json({ error: 'code e discount são obrigatórios' }, { status: 400 })
  }

  const discountNum = parseFloat(discount)
  if (isNaN(discountNum) || discountNum <= 0) {
    return NextResponse.json({ error: 'discount deve ser um número positivo' }, { status: 400 })
  }

  if (!['percent', 'fixed'].includes(type)) {
    return NextResponse.json({ error: 'type deve ser "percent" ou "fixed"' }, { status: 400 })
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discount: discountNum,
        type,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno ao criar cupom' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  try {
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 })
  }
}
