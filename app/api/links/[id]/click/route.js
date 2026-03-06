import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'

/**
 * API Route: Click Tracking & Redirect
 * 
 * Registra o clique e redireciona para a URL de destino
 */
export async function GET(request, { params }) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const url = searchParams.get('url')

        if (!url) {
            return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
        }

        // Registrar clique em background (não bloqueia o redirect)
        try {
            await prisma.link.update({
                where: { id },
                data: {
                    clicks: {
                        increment: 1,
                    },
                },
            })

            // Registrar log do clique
            const userAgent = request.headers.get('user-agent') || null
            const referrer = request.headers.get('referer') || null

            await prisma.click.create({
                data: {
                    linkId: id,
                    userAgent,
                    referrer,
                },
            })
        } catch (error) {
            // Não bloqueia o redirect se o tracking falhar
            console.error('Erro ao registrar clique:', error)
        }

        // Redirecionar para a URL de destino
        return NextResponse.redirect(url)
    } catch (error) {
        console.error('Erro no tracking de clique:', error)
        // Em caso de erro, tenta redirecionar mesmo assim
        const { searchParams } = new URL(request.url)
        const url = searchParams.get('url')
        if (url) {
            return NextResponse.redirect(url)
        }
        return NextResponse.json({ error: 'Erro ao processar clique' }, { status: 500 })
    }
}
